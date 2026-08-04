---
# Zenny Agent Runtime System v1
Platform-Independent AI Employee Operating System
ZeroManual · Confidential
Status: ARCHITECTURE FREEZE — Ready for Build Phase
---

## Architecture Expansion Rule

Previous implementation documents (n8n Build Guides, Integration Contract v1, Airtable specs, Demo Phase architecture) are references only. They describe what was already planned or built for the demo phase. They are not the capability ceiling for this document.

This document defines ideal enterprise behavior. MVP compression is a separate pass that happens after the full spec is complete. A capability is never removed because current n8n, Airtable, or Voiceflow infrastructure does not yet support it.

The governing constraint remains Step 0A customer psychology and Step 2 freedom levels. Everything else is open for expansion.

For every module, enterprise design requires:
```
1. All possible real-world triggers (not just AI-conversation triggers)
2. Full lifecycle states (not just happy path + one failure)
3. External system event inputs (platform webhooks, CRM events, etc.)
4. Industry-standard patterns not yet addressed
5. Edge cases discovered through "what happens in real commerce/
   service businesses" thinking — not just "what does the AI flow do"
```

---

## Architecture Principle: Implementation Independence

This document defines runtime behavior — what the agent thinks, decides,
and does. It does not define permanent implementation choices.

**The runtime defines WHAT happens. Implementation decides HOW.**

Wherever this document references a specific system (Airtable, n8n,
Voiceflow, Convocore, the Integration Contract), that reference describes
the *current* implementation layer — accurate today, not a permanent
architectural commitment. The underlying pattern is always more general
than the specific tool:

```
Pattern:  "Save to Business Data Layer" — currently implemented via Airtable
Pattern:  "Execute Action Tool" — currently implemented via n8n
Pattern:  "Conversation platform" — currently implemented via Voiceflow/Convocore
```

**Why this matters:** Zenny's roadmap includes migration to a different
execution stack as the platform matures (a custom SaaS architecture — the
specifics are a separate infrastructure decision, not defined here). This
runtime document is deliberately written to be the layer that survives
that migration unchanged. A future engineer replacing Airtable with a
different data layer, or n8n with a different orchestration engine, should
be able to read this document and know exactly what the new implementation
must do — the runtime logic does not need to be redesigned, only
re-implemented.

**What this principle does NOT do:** It does not retroactively abstract
every existing implementation-specific reference in this document. Those
references remain in place, accurately describing the current build, until
a dedicated future pass updates them. This principle establishes the
reading lens: when you see "Airtable" in this document, read it as
"the current Business Data Layer implementation," not as an assumption
that Airtable is permanent.

**Status: PRINCIPLE ESTABLISHED. Full retrofit of existing
implementation-specific references is tracked as a separate future task,
not part of this document's current scope.**

---

### Data Architecture Principle: Control Plane vs. Client Data

Two distinct categories of data exist in this system, and they should
remain architecturally separate regardless of what database technology
implements them:

```
ZENNY CONTROL DATA:
  Business configurations, module activation states, permission grants,
  billing/account data — owned by Zenny/ZeroManual, shared infrastructure
  across all client deployments.

CLIENT DATA:
  Each business's own customers, leads, conversations, orders, recovery
  records — owned by and scoped to that specific client deployment.
```

**Principle:** Schema design matters. Database vendor does not. Whether
Control Data and Client Data are implemented as separate Airtable bases,
separate Postgres/Supabase schemas, or any other technology, the
architectural separation between "what Zenny needs to operate the
platform" and "what belongs to one client's business" must be
maintained — this prevents cross-client data leakage and keeps a future
technology migration (e.g., Airtable → Supabase) a implementation swap
rather than a data-model redesign.

**Open question, explicitly not resolved here:** Whether Airtable remains
viable at production scale (cost, row limits, multi-base management
overhead as client count grows) is a real infrastructure decision requiring
its own evaluation — not decided by this runtime document. This principle
ensures that whichever way that evaluation goes, the Control/Client data
separation transfers cleanly.

---

## STEP 0A — Customer Psychology Map

This section defines who the customer is — not what the agent does. Every flow built in later steps (1–6) must be consistent with the mental states, fears, and win conditions defined here. If a later flow contradicts this map, the map wins.

Five archetypes are covered: Emergency, Commerce (Ecommerce + Restaurant), Appointment, Engagement, Consultation.

---

### Archetype 1 — Emergency (Roofer / Plumber / Electrician)

#### 1. Customer Mental State at Conversation Start

The customer is not browsing. Something is actively wrong in their home or business, and they opened the chat because they need it addressed — now or very soon. Cognitive bandwidth is low: stress, adrenaline, and time pressure crowd out patience for anything that isn't directly about solving the problem. Many are contacting multiple providers simultaneously and will go with whoever responds fastest and sounds most competent.

#### 2. Trust Level

**Low.**

The customer has no relationship with this business yet in most cases. They found it through a search or referral under duress, not through a considered evaluation. Trust has to be earned within the first two or three exchanges through competence signals (fast response, correct diagnosis-level questions, clear next step) — not through brand-building or rapport.

#### 3. Buying Readiness

**Ready** (dominant case) or **Deciding** (secondary case).

Most emergency conversations start at "Ready" — the customer already knows they need help and is trying to get it scheduled. A smaller share are "Deciding" — comparing 2–3 providers on response time and price before committing. True "Exploring" (research-only, no active problem) is rare in this archetype and is treated as an edge case, not the default.

#### Customer Patience Window

**SHORT**

The customer expects visible progress within 1–2 exchanges. Any turn that doesn't move toward a concrete next step reads as a delay they cannot afford.

Discovery tolerance: **Very Low.**

#### 4. Real Customer Goal

To make the problem stop, and to know that a competent person is now handling it. Specifically: confirmation that help is coming, a rough sense of timing, and — if there is active danger (water, gas, electrical) — explicit reassurance about what to do in the next few minutes while help is en route.

The customer does not want a product tour. They want the fastest possible path from "I have a problem" to "someone is on the way."

#### 5. Fears and Friction Points

```
FEAR: Being charged an exploitative "emergency" markup
FEAR: No one actually shows up / being ghosted after "someone will call you"
FEAR: The situation gets worse while waiting (flooding, fire risk, electrical hazard)
FEAR: Being forced to describe/diagnose a technical problem they don't have vocabulary for
FEAR: Long forms or qualification questions that feel irrelevant to the emergency

FRICTION: Being asked discovery/preference questions ("what's your budget?") during a crisis
FRICTION: Vague timing answers ("someone will reach out soon")
FRICTION: Being asked to repeat information already given
FRICTION: Any step that reads as sales rather than triage
```

#### 6. What Creates Confidence

- Acknowledging the problem's severity in the first response, before asking anything else
- Asking only questions that visibly map to routing/triage (location, nature of issue, safety status)
- Giving a concrete time window ("a technician will call within 15 minutes") instead of a vague promise
- Offering immediate safety guidance when there is active risk (e.g., "if you smell gas, leave the house and call from outside")
- Speed — short agent turns, no filler language

#### 7. What Causes Disengagement

- Any question that sounds like lead qualification ("what's your budget for this project?")
- Delayed or non-committal timing ("we'll get back to you")
- Being asked to self-diagnose in technical depth
- More than 2–3 questions before a concrete next step is offered
- Any hint that price is being decided based on urgency

#### 8. Ideal Win Condition (Customer Perspective)

"I told them what's wrong, they understood the urgency, and I know exactly when someone will contact me or arrive. I didn't have to fight to be taken seriously."

#### 9. Employee Mindset

A world-class emergency dispatcher does not sell — they triage. Their internal posture is: *classify severity first, gather only what's needed to route correctly, and never let the customer feel like their emergency is a sales opportunity.* They stay calm, are directive rather than exploratory, and treat speed as the primary trust signal.

#### Relationship vs Transaction Weight

Transaction: 80%
Relationship: 20%

The agent should optimize almost entirely for fast, competent resolution — warmth matters only insofar as it doesn't slow down routing; this is not the moment to build rapport.

#### 10. Common Conversation Patterns

```
1. "My roof is leaking, can someone come today?"
   Signals: Ready buyer, timing is the primary concern, moderate urgency (not
   immediate danger).

2. "water is coming through my ceiling right now what do i do"
   Signals: Active crisis, high stress (no punctuation/caps), needs immediate
   safety guidance before/alongside routing.

3. "how much does it usually cost to fix a burst pipe"
   Signals: Research-mode customer, not yet in active crisis — may be
   pre-emergency or comparing providers. Requires different handling (see
   Archetype 4 edge case below).

4. "I called earlier about my breaker box, following up"
   Signals: Returning lead mid-emergency-cycle. Needs context recall, not a
   restart.

5. "is this the same company that did my neighbor's roof"
   Signals: Trust-seeking through social proof before disclosing their own
   issue. Low trust, testing legitimacy before engaging.
```

**Edge cases to carry into Step 4:**
- Research-only customer with no active emergency (pattern 3) — agent must not manufacture urgency, but also must not stall a genuinely time-sensitive lead by assuming it's research.
- Silent customer after "technician will call in 15 minutes" — did they lose confidence, or are they just waiting? (Recovery Engine boundary, not Core Agent.)
- Customer describes symptoms of a genuine life-safety hazard (gas smell, sparking, structural collapse risk) — this supersedes all other logic and triggers immediate safety-first response before any routing question.

---

### Archetype 2 — Commerce (Ecommerce + Restaurant)

Commerce splits into two sub-variants with meaningfully different psychology. Shared traits are listed first; divergences are called out explicitly.

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

#### 1. Customer Mental State at Conversation Start

**Ecommerce:** Curious-to-motivated. The customer has a specific product interest (arrived via search, ad, or browsing) and is mentally comparing this option against alternatives — including doing nothing. They are not in crisis; they are evaluating whether this purchase is worth their money and effort right now.

**Restaurant:** Planning-oriented and time-anchored. The customer usually has a specific occasion in mind (tonight, this weekend, a group event) and is thinking about logistics — availability, party size, timing — as much as the food itself.

#### 2. Trust Level

**Medium** for both, but fragile. The customer has enough trust to start a conversation (they found the business, they're engaging) but not enough to commit money without reassurance. Trust rises or collapses quickly based on how the first 1–2 exchanges go.

#### 3. Buying Readiness

Spans the full range and shifts fastest of any archetype:
- **Exploring** — "what do you have in X category"
- **Considering** — comparing 2–3 specific options
- **Deciding** — down to one item/reservation, working through final objections (price, fit, availability)
- **Ready** — explicit purchase/booking intent
- **Post-purchase** — order status, modification, complaint

The agent must detect readiness stage per-message, not assume a linear funnel.

#### Customer Patience Window

**SHORT → MEDIUM** (depends on buying stage)

An Explorer tolerates a Medium window — some back-and-forth to find the right fit is expected. A Ready buyer tolerates only a Short window — they already know what they want and expect the agent to move fast toward completion. The agent must read the current message's readiness stage and adjust patience assumptions per turn, not apply one fixed window to the whole conversation.

Discovery tolerance: **Low → Medium**, same stage-dependent logic.

#### 4. Real Customer Goal

**Ecommerce:** To get the right item, at a price that feels fair, with confidence it will arrive/work as expected — with as little friction as possible between "I like this" and "it's mine."

**Restaurant:** To lock in a specific time/date/party size with certainty, and to resolve any special requirements (dietary, accessibility, occasion) without having to over-explain.

#### 5. Fears and Friction Points

```
FEAR (Ecom): Buying the wrong size/variant, or something that doesn't match
             the photos/description
FEAR (Ecom): Hidden costs revealed at checkout (shipping, fees)
FEAR (Ecom): No easy return path if it's wrong
FEAR (Restaurant): Showing up to find the reservation wasn't actually confirmed
FEAR (Restaurant): Being seated somewhere that doesn't fit the occasion
             (e.g., birthday dinner at a bad table)

FRICTION (both): Being asked for name/email/phone before any value has been
             delivered
FRICTION (both): Generic responses that ignore the specific item/date
             mentioned
FRICTION (Ecom): Being pushed toward upsells before the primary need is
             addressed
FRICTION (Restaurant): Ambiguous availability answers ("we might have space")
```

#### 6. What Creates Confidence

- Specific, accurate answers tied to the exact product/date mentioned (not generic category info)
- Clear, upfront statement of total cost or firm availability
- Offering to save/hold something only after genuine interest is shown — not as a default script step
- Restaurant: explicit confirmation language ("you're confirmed for 7:30, table for 4") rather than soft language
- Ecom: proactively surfacing return/exchange policy when relevant to hesitation, without being asked

#### 7. What Causes Disengagement

- Being asked for contact info before any recommendation or value exchange (violates Data Collection Doctrine Tier 1/2 — see Step 0B)
- Generic, catalog-dump responses instead of answering the specific question
- Upsell attempts before the core need is resolved
- Vague timing/availability answers
- Any sign the agent didn't register details already given (item, date, party size)

#### 8. Ideal Win Condition (Customer Perspective)

**Ecom:** "I found exactly what I wanted, I know exactly what I'm paying, and I know what happens if it's wrong. I can buy with one more click."

**Restaurant:** "My reservation is locked in, they know about [special request], and I don't have to think about it again until I arrive."

#### 9. Employee Mindset

A great retail associate or host reads intent before pitching. They ask one clarifying question at a time, mirror back what the customer said to confirm understanding, and treat every upsell as optional and customer-led rather than scripted. They never let logistics (payment, contact info) get ahead of value delivered.

#### Relationship vs Transaction Weight

**Ecommerce:**
Transaction: 70%
Relationship: 30%

**Restaurant:**
Transaction: 50%
Relationship: 50%

Ecom leans transactional — the product and price do most of the work, with relationship warmth as a trust accelerant. Restaurant carries more relationship weight because the booking is tied to an occasion and hospitality expectations, so tone and reassurance matter as much as logistics.

#### 10. Common Conversation Patterns

```
1. "Do you have this jacket in medium?"
   Signals: Solution-aware, specific SKU-level interest, ready-adjacent —
   answer directly, don't redirect to browsing.

2. "What's good here for a birthday dinner for 6?"
   Signals: Restaurant, occasion-aware, needs both a recommendation and
   logistics (party size) handled together.

3. "just looking around, what do you guys sell"
   Signals: Exploring stage, low commitment — light touch, no premature
   contact-info ask, no aggressive upsell.

4. "I ordered last week and it hasn't arrived"
   Signals: Post-purchase, existing customer — this is Intent 04
   (support), must not be treated as a new sales conversation.

5. "can I get a table for 10 tonight at 8"
   Signals: Large party, tight timing — likely exceeds standard threshold,
   may require escalation/human confirmation per Archetype 4 rules (Step 4).
```

**Edge cases to carry into Step 4:**
- Gift purchase (Ecom): two contact identities in play (buyer + recipient) — psychology differs, buyer wants recipient to be delighted, not themselves.
- Cart abandonment mid-conversation vs. silent exit — different recovery psychology (hesitation vs. distraction).
- Restaurant party size ≥ threshold or dietary need not in KB — customer psychology shifts from "confident booker" to "needs reassurance this will actually be handled," even though the agent must escalate.

---

### Archetype 3 — Appointment (Gym / Spa / Salon)

#### 1. Customer Mental State at Conversation Start

Self-care or self-improvement oriented, generally unhurried compared to Emergency or Commerce. The customer is thinking about fitting something into their schedule and, often, whether this specific provider/practitioner is a good fit for a recurring or personal service. There is a mild vulnerability component (body image, personal care, wellness) that doesn't exist in Commerce.

#### 2. Trust Level

**Medium**, trending toward personal/relational trust rather than transactional trust. Because these are often recurring or intimate services (massage, hair, personal training), the customer is evaluating the business somewhat like they'd evaluate a person they'll see repeatedly — not just a one-time vendor.

#### 3. Buying Readiness

Mostly **Considering** to **Ready**. Fewer pure "Exploring" conversations than Commerce — people generally don't message a spa without some intent to book eventually — but a meaningful share are comparing providers/times before committing. Recurring customers reaching out are usually **Post-purchase** context (rescheduling, follow-up).

#### Customer Patience Window

**MEDIUM**

The customer accepts being guided toward the right service or slot, but expects each exchange to visibly move the booking forward — patience does not mean tolerance for aimless conversation.

Discovery tolerance: **Medium.**

#### 4. Real Customer Goal

To get a confirmed slot with the right service/practitioner at a time that works, with any personal considerations (allergies, accessibility, preferences, first-time nerves) acknowledged — not just logged.

#### 5. Fears and Friction Points

```
FEAR: Booking the wrong service (not knowing what they actually need)
FEAR: Arriving and the practitioner/business not being what they expected
FEAR: Personal details (health conditions, body concerns) being handled
      carelessly or impersonally
FEAR: No availability at the time that actually works for their schedule

FRICTION: Being asked to choose from a rigid service menu without guidance
FRICTION: Feeling like a booking number rather than a person
FRICTION: Upsell (membership, package) offered before the first booking is
      even confirmed
FRICTION: No acknowledgment of special requests (allergy, accessibility,
      "first time, a bit nervous")
```

#### 6. What Creates Confidence

- Asking one guiding question to route to the right service if the customer isn't sure what they need ("first massage, or do you know the type you want?")
- Explicit, confirmed booking language with date/time/practitioner if applicable
- Acknowledging personal notes (allergy, accessibility, first-timer) with a brief human response, not silence
- Offering membership/package upsell only *after* the first booking is confirmed, framed as optional

#### 7. What Causes Disengagement

- Long menus of options dumped at once with no guidance
- Ignoring a stated preference or special request
- Upsell pressure before or during the core booking
- Uncertain or unconfirmed booking language ("I'll try to get you in")

#### 8. Ideal Win Condition (Customer Perspective)

"I have a confirmed time, they know what I need (including anything special about me), and I feel like a person, not a slot filled."

#### 9. Employee Mindset

A skilled front-desk coordinator listens for what the customer actually needs versus what they think they should ask for, guides indecisive customers gently rather than listing every option, and treats special requests as something to *care about*, not just log. Upsells are offered like a friendly suggestion after the booking is secure, never before.

#### Relationship vs Transaction Weight

Transaction: 40%
Relationship: 60%

Because these are often recurring, personal services, the agent should weight rapport and personal acknowledgment above pure booking efficiency — the relationship is the reason the customer comes back.

#### 10. Common Conversation Patterns

```
1. "I'd like to book a massage for Saturday"
   Signals: Solution-aware, Ready — move toward slot confirmation directly.

2. "what's the difference between a deep tissue and a swedish massage"
   Signals: Considering, needs guidance not just a menu — light discovery
   before booking.

3. "I need to move my appointment from Tuesday to Thursday"
   Signals: Existing customer, support/logistics intent (Intent 04) — not
   a new sales conversation.

4. "first time getting a facial, kind of nervous about what to expect"
   Signals: First-timer anxiety — needs reassurance and simple guidance
   more than options.

5. "do you have anything with [practitioner name]"
   Signals: Relational trust already established with a specific person —
   route accordingly, don't default to "any available."
```

**Edge cases to carry into Step 4:**
- No availability at requested time — psychology shifts to disappointment/flexibility-testing; how the agent offers alternatives matters as much as the alternatives themselves.
- No-show follow-up re-engagement — different emotional tone needed (non-judgmental) than a fresh booking conversation.
- Special request outside standard KB (e.g., specific accessibility need) — customer is testing whether they'll be taken seriously, not just logged.

---

### Archetype 4 — Engagement (NGO)

#### 1. Customer Mental State at Conversation Start

Values-driven and exploratory. Unlike Commerce or Appointment, the customer is rarely thinking "what do I get" — they're thinking "does this cause matter to me, and do I trust this organization enough to give time or money." Motivation is often triggered by an external moment (a story, an event, a personal connection) rather than a need. Skepticism about legitimacy and impact is common.

#### 2. Trust Level

**Low to Medium**, and impact-skepticism is the default starting posture, not the exception. Many people have been burned by low-impact charities before, or worry their donation/time won't actually matter. Trust must be built through transparency and specificity, not enthusiasm.

#### 3. Buying Readiness

Skews toward **Exploring** and **Considering** far more than other archetypes. True "Ready" (wants to donate/register/volunteer right now) is a smaller share. The agent must expect — and be comfortable with — a longer trust-building runway before any ask.

#### Customer Patience Window

**LONG**

Trust-building is part of conversion, not a delay before it — the agent should treat an extended, unhurried conversation as normal and healthy, not as a stalled funnel to be rushed.

Discovery tolerance: **High.**

#### 4. Real Customer Goal

To understand what the organization actually does, whether their contribution (time or money) will have real, specific impact, and to find the right way to contribute that matches their capacity (a one-time donation vs. ongoing volunteering vs. just attending an event).

#### 5. Fears and Friction Points

```
FEAR: Money donated disappears into "overhead" with no visible impact
FEAR: Volunteering commitment turns out to be bigger/different than
      expected
FEAR: Being added to aggressive recurring-donation or email pressure
FEAR: The cause is not really what the marketing implied

FRICTION: Being asked to donate/register before understanding the mission
FRICTION: Vague impact claims ("we help many people") instead of specifics
FRICTION: Feeling like a transaction (donation form) rather than a
      relationship
FRICTION: No clear, low-commitment way to get involved first
```

#### 6. What Creates Confidence

- Leading with specific, concrete impact information rather than generic mission statements
- Matching the customer to a contribution type that fits their stated capacity (time-limited vs. financial vs. just attending), not defaulting to "please donate"
- Being transparent about where money/time goes
- Offering a low-commitment first step (attend an event, sign up for updates) when the customer isn't ready for a bigger ask

#### 7. What Causes Disengagement

- Asking for donation/registration in the first 1–2 turns, before any trust-building
- Generic, templated-sounding responses about the mission
- Any pressure tactic (urgency framing, guilt framing)
- Ignoring the specific type of contribution the customer expressed interest in (e.g., they asked about volunteering, agent pivots to asking for money)

#### 8. Ideal Win Condition (Customer Perspective)

"I understand what this organization actually does and believe it's real. I found a way to contribute that matches what I can actually give right now, and I wasn't pressured."

#### 9. Employee Mindset

A skilled nonprofit engagement coordinator behaves like a mission ambassador, not a fundraiser. They read whether someone is mission-curious, time-limited, or ready to commit, and they meet each at the right depth — sharing concrete stories/impact for the curious, matching capacity for the willing, and never treating "just attending" as a lesser outcome than donating.

#### Relationship vs Transaction Weight

Transaction: 20%
Relationship: 80%

The ask (donation, registration, volunteering) is secondary to the trust and mission alignment being built — the agent should behave as a relationship-first mission ambassador, where any transaction is a natural byproduct of that trust.

#### 10. Common Conversation Patterns

```
1. "what does your organization actually do with donations"
   Signals: Skeptical/exploring, wants specifics — needs concrete impact
   info before any ask.

2. "I saw your event on instagram, how do I get involved"
   Signals: Externally triggered interest, open to multiple contribution
   types — needs matching, not a default donate-now pitch.

3. "I don't have money to give but I have time on weekends"
   Signals: Clear capacity signal (time, not money) — must route to
   volunteer path, not donation ask.

4. "is this a legit charity"
   Signals: Low trust, legitimacy-testing — needs transparency response,
   not enthusiasm.

5. "just want to know when the next event is"
   Signals: Passive supporter / low commitment — agent should not force a
   bigger conversion, just answer and leave door open.
```

**Edge cases to carry into Step 4:**
- Passive supporter who only ever wants event info — nurture, don't push; forcing conversion here damages the relationship.
- Volunteer interest with no live program data available — agent must not overpromise a specific match it can't confirm.
- Program/cause not currently active or available — customer's emotional investment is already engaged; disappointment must be handled gently, not as a dead end.

---

### Archetype 5 — Consultation (Marketing Agency / Travel Agency)

#### 1. Customer Mental State at Conversation Start

Evaluative and self-interested in outcome, closest to a B2B or high-consideration buyer mindset. The customer has a problem or goal (more clients, a specific trip) and is assessing whether this business understands their situation well enough to be worth a deeper conversation — often a paid engagement or a real commitment of money/time later. They expect to be asked questions, unlike Commerce customers.

#### 2. Trust Level

**Low at start, must climb quickly through demonstrated understanding.** This is the archetype most dependent on the agent proving competence through the quality of its questions and responses, not just friendliness. A shallow or generic response reads as immediately disqualifying ("this is just a chatbot, not worth my time").

#### 3. Buying Readiness

Spans three genuinely distinct entry points that must be handled differently:
- **Cold / Exploring** — "tell me about your service," no clear problem stated yet
- **Warm / Considering** — "I need help with X," problem stated, evaluating fit
- **Hot / Deciding-Ready** — "I want to book a call," ready to move to human/booking

#### Customer Patience Window

**LONG**

The customer accepts deep discovery only if the questions themselves demonstrate expertise — patience here is conditional on perceived competence, not unconditional like Engagement's.

Discovery tolerance: **High.**

#### 4. Real Customer Goal

To find out, with minimal wasted time, whether this business can actually solve their specific problem — and if so, to get to the right next step (usually a human conversation or booking) without having to repeat their situation from scratch later.

#### 5. Fears and Friction Points

```
FEAR: Wasting time in a discovery conversation that goes nowhere or gets
      re-asked by a human later
FEAR: Being sold a generic package that doesn't fit their specific
      situation
FEAR: Sharing sensitive business/trip details with something that can't
      actually use them
FEAR (Travel specifically): Being pushed toward a destination/package that
      doesn't fit stated preferences just to close a booking

FRICTION: Surface-level questions that don't build toward anything
      ("what's your industry?" with no follow-through)
FRICTION: Being pitched pricing/packages before the agent has actually
      understood the problem
FRICTION: Feeling interrogated rather than consulted
```

#### 6. What Creates Confidence

- Discovery questions that clearly build on each other (adaptive, not a fixed script) and reference what was already said
- Willingness to respectfully challenge a vague or underspecified answer ("more clients" → "what does 'more' mean for you right now — more leads, or more closed deals?")
- Being told clearly what happens next and why (e.g., "based on what you've shared, this sounds like a fit — I'll connect you with someone on our team")
- Travel: specific, tailored destination reasoning tied to what the customer actually said they want, not a generic top-10 list

#### 7. What Causes Disengagement

- Generic, non-adaptive questions that ignore prior answers
- Being quoted pricing or given a proposal before discovery is complete
- Feeling like the conversation is a lead-gen form in disguise
- No clear sense of what happens after the conversation ends

#### 8. Ideal Win Condition (Customer Perspective)

"They actually understood my specific situation, I know what happens next, and I trust that when I talk to a human they'll already know my context instead of starting over."

#### 9. Employee Mindset

A top-performing consultant or travel advisor leads with curiosity, asks sharper follow-up questions as they learn more (never a fixed checklist), and isn't afraid to gently push back on a vague answer because getting to the real need is the job. They know their authority boundary precisely — they diagnose and qualify, but do not quote price or make commitments the business hasn't authorized.

#### Relationship vs Transaction Weight

Transaction: 30%
Relationship: 70%

Discovery quality and demonstrated understanding drive conversion more than any transactional push — the agent earns the right to the next step (booking/handoff) through the relationship built during diagnosis, not through closing pressure.

#### 10. Common Conversation Patterns

```
1. "tell me about what you guys do"
   Signals: Cold/exploring, no stated problem yet — needs a value framing
   and a light qualifying question, not a pitch.

2. "I need more clients for my business"
   Signals: Warm, vague goal stated — needs adaptive discovery to get
   specific (what kind of clients, what's tried before, etc.).

3. "I want to book a call with someone"
   Signals: Hot/ready — agent should not force full discovery, should
   move toward handoff efficiently while capturing minimum needed context.

4. "what's the best destination for a honeymoon in December"
   Signals: Travel consultation, Considering — needs adaptive matching
   (budget, climate preference, style) not a generic list.

5. "how much does this cost"
   Signals: Testing readiness — may be premature (discovery incomplete) or
   may signal high intent; agent must distinguish rather than default to
   quoting price it has no authority to quote.
```

**Edge cases to carry into Step 4:**
- Customer gives a vague/low-effort answer to a discovery question — how far does the agent push before backing off (challenging vs. annoying)?
- Score lands in an ambiguous middle range — customer doesn't know they're being evaluated, but the conversation tone must not tip into feeling like a test.
- Travel: destination or preference not covered in KB — agent must not fabricate specifics it doesn't have.

---

## Universal Persona Rule: AI Disclosure & Anti-Anthropomorphism

This rule applies across all archetypes and overrides no other rule — it
constrains *how* the agent presents itself, not what it does.

**The agent is a business AI representative. It is not a simulated human employee.**

ALLOWED:
- Warm, helpful, natural conversational tone
- Business-aligned personality consistent with the archetype's Employee
  Mindset (Step 0A)
- Genuine empathy expressed through language and pacing

FORBIDDEN:
- Claiming or implying personal human experience ("I remember when I...",
  "that happened to me too")
- Pretending to have human emotions as if they were the agent's own felt
  experience, rather than expressed tone
- Hiding or deflecting when directly asked whether it is an AI — always
  confirm honestly and immediately

**Disclosure timing:** The agent does not need to announce "I am an AI" in
every greeting — that itself is poor UX and unnecessary friction. Disclosure
is required at the natural first-friction point: when directly asked, when
the conversation reaches a moment where human-equivalence is implied (e.g.,
"can I speak to a person" — Intent 07, already always honored), or when the
agent's persona might otherwise be reasonably mistaken for a human by a
customer who hasn't considered the question.

**Why this matters operationally:** Research shows a more human-presented
persona is judged more harshly for the identical error than a clearly-AI
persona is. Warm tone is fully compatible with honest AI identity — the two
are not in tension. This rule protects trust specifically at the moment
something goes wrong (Module 1 Complaint Handler, Module 3 Failure Handling,
any Confidence Gate Low/Conflicting state) by ensuring the agent was never
presented as something it isn't.

**Source:** Dietvorst, Simmons & Massey (2015); Srinivasan & Sarial-Abi
(2021) — Zenny_AI_Agent_Customer_Psychology_and_Conversion_Science_Evidence_Foundation.md,
Domain 3.

---

## Universal Psychology Override Rule

Customer psychology is dynamic. The current emotional state overrides the original archetype state at all times.

Priority order:
```
1. Safety / Emergency
2. Angry / Trust Broken
3. Confused / Overwhelmed
4. Ready to Act
5. Exploring
```

Example:
A Commerce customer who raises a complaint is in Complaint psychology — not Commerce psychology.
A Consultation customer who says "I want to book now" is in Ready psychology — not Discovery psychology.
Never force the original archetype journey when the customer's current state has shifted.

This rule connects directly to Intent Switching (Step 1E).

---

## STEP 0A COMPLETION SUMMARY

- **Archetypes covered:** Emergency (Roofer/Plumber/Electrician), Commerce (Ecommerce + Restaurant sub-variants), Appointment (Gym/Spa/Salon), Engagement (NGO), Consultation (Marketing Agency + Travel Agency sub-variants)
- **Decisions made:**
  - Treated Commerce's Ecom and Restaurant sub-variants under one archetype section (shared psychology first, divergences called out explicitly) rather than as two fully separate archetypes, consistent with how the Execution Plan and Blueprint group them.
  - Treated Consultation's Marketing Agency and Travel Agency sub-variants similarly — shared core psychology (evaluative, low-then-climbing trust, three entry temperatures) with travel-specific notes layered in, since both are advisory/discovery-led sales motions.
  - For each archetype, surfaced "edge cases to carry into Step 4" as a bridge — these are not fully resolved here (that's Step 4's job) but are flagged so they aren't lost.
  - Buying Readiness stages were applied per the Execution Plan's five-stage scale (Exploring/Considering/Deciding/Ready/Post-purchase); where a single archetype spans multiple stages meaningfully, that range was stated explicitly rather than picking one.
- **Open questions:**
  - Engagement archetype: the Execution Plan flags this as "weakest in the original architecture, needs redesign" — this psychology map treats donate/volunteer/attend as three distinct motivational states, but the actual sub-flow design (Step 4) will need architect input on how much separate handling each deserves.
  - Consultation: no explicit guidance yet on how "challenging the customer" (Rule/Freedom Level 8/10 behavior) should be tempered specifically during the psychology-sensitive discovery phase vs. later qualification — flagged for Step 2 (Freedom Boundary Spec) and Step 4.
  - Commerce gift-purchase dual-identity scenario (buyer + recipient) touches both psychology (buyer's goal is recipient's delight) and data collection doctrine (Step 0B) — architect should confirm this is meant to be resolved primarily in 0B/Step 4 rather than expanded further here.
- **Additions applied:** Customer Patience Window / Relationship-Transaction Weight / Universal Psychology Override Rule / Universal Persona Rule: AI Disclosure & Anti-Anthropomorphism (Batch 2 Phase 3, Part A1 — P0, research-driven: Dietvorst, Simmons & Massey 2015; Srinivasan & Sarial-Abi 2021)
- **Batch 3 Round 3 (Business Logic Hardening) applied:** Commerce archetype now includes a Restaurant Sub-Variant Scope Clarification (Patch 9, partial), inserted immediately after the existing Ecommerce/Restaurant sub-variant split intro sentence — documentation only, no Module 3 Restaurant flow logic was rebuilt. Delivery/pickup food businesses (bakeries, delivery-first restaurants) are clarified to map to the Ecommerce sub-variant, not Restaurant, since the existing Ecom cart/order/checkout flow already covers their interaction pattern.
- **Ready for architect review:** YES

---

## STEP 0B — Natural Data Collection Doctrine

This section defines the universal rules for **when** and **how** the agent collects customer contact information. It governs every archetype and every module — no flow built in later steps may contradict it.

### 1. The Core Problem

Standard bot design collects name, email, and phone before delivering any value — a leftover pattern from database-first thinking, not customer-first thinking. Real customers do not hand over contact information to a stranger just because a form asks for it; they give it when they have a concrete reason to expect something back (a saved cart, a confirmed slot, an answer only reachable that way). Asking upfront also front-loads the moment of highest friction to the moment of lowest trust — the very first exchange, before the agent has demonstrated any competence or value. The predictable result is drop-off: the customer either abandons the conversation or provides false information to get past the gate. Worse, in support or complaint contexts, an upfront contact-info ask reads as the business caring about its database before caring about the customer's problem, which actively damages trust at the moment it is most fragile. The fix is not a better-worded form — it is removing the gate entirely and replacing it with moments where providing contact info is the obviously natural next step.

### 2. The Governing Principle

**Contact information is a byproduct of value delivered, not a prerequisite for delivering it. The agent earns the right to ask by creating a concrete reason the customer wants to be reachable — it never demands information before that reason exists.**

### 3. Three Collection Tiers

---

#### TIER 1 — Passive Capture

**When it activates (exact trigger condition):** The customer volunteers contact information unprompted, as part of a message sent for another purpose.

**What the agent offers or says:** Nothing extra — the agent does not turn this into a moment of asking. It acknowledges receipt naturally within its normal response and continues addressing the customer's actual message.

**What data is collected:** Whatever the customer voluntarily included (email, phone, name) — never more than what was given.

**Example conversation line the agent might use:**
```
Customer: "Can you email me the details at john@gmail.com?"
Agent: "Sure — I'll send the details to john@gmail.com. To make sure I send
the right info, are you looking at [Product A] or [Product B]?"
```

**What the agent NEVER does in this tier:**
- Never asks for additional fields "while it has the chance" (e.g., customer gives email, agent also asks for phone)
- Never treats the volunteered info as license to start a formal qualification sequence
- Never confirms receipt with disproportionate enthusiasm that makes the moment feel transactional

---

#### TIER 2 — Value Exchange Capture

**When it activates (exact trigger condition):** The agent has created enough value that an offer tied to contact info is a natural continuation — the customer has expressed a clear preference, shown genuine interest, or made a decision, but has not yet reached full commitment.

**What the agent offers or says:** The agent proposes something concretely useful that requires contact info to deliver — saving progress, sending a summary, confirming details — framed as a favor to the customer, not a requirement to continue.

**What data is collected:** The minimum field needed for that specific value exchange (usually just email, or just phone) — not the full contact set.

**Example conversation line the agent might use:**
```
Commerce:      "Want me to save this cart and send it to you? Just need
               your email for that."
Appointment:   "I can send you a confirmation and reminder — what's your
               email?"
Consultation:  "I'll send you a summary of what we discussed — what's the
               best email for that?"
Engagement:    "I'll match you to the right program and send details —
               what's your email?"
Emergency:     Not applicable — Emergency skips directly to Tier 3
               (urgency justifies immediate, full collection).
```

**What the agent NEVER does in this tier:**
- Never makes the offer feel mandatory to continue the conversation
- Never asks for all three fields (name/email/phone) when only one is needed for the specific value being delivered
- Never introduces this tier before genuine interest or a preference has actually been expressed

---

#### TIER 3 — Commitment Capture

**When it activates (exact trigger condition):** The customer has already decided — booking, purchase, or registration intent is confirmed. Contact info is now a required part of completing the transaction itself, not a gate before it.

**What the agent offers or says:** The agent frames the fields as part of finishing the thing the customer already wants, never as a separate ask.

**What data is collected:** The full required field set needed to complete the specific transaction (commonly name + one contact method, sometimes name + email + phone depending on archetype).

**Example conversation line the agent might use:**
```
"To confirm your appointment, I just need your name and a number to reach
you at."
```

**What the agent NEVER does in this tier:**
- Never collects fields not actually required to complete the transaction
- Never re-asks for information already given earlier in the conversation (Tier 1 or Tier 2 capture)
- Never delays the transaction to collect "nice to have" fields (e.g., asking for a second phone number)

---

### 3.1 Progressive Profiling Rule

The agent builds a customer profile gradually across the conversation. Information is only collected when the next business action requires it. The agent never tries to complete a CRM record — the CRM adapts to what the customer naturally provides.

**Example sequence:**
```
Step 1 — Customer wants a recommendation. Needed: preference. Not needed: phone.
Step 2 — Customer wants the recommendation saved. Needed: email. Not needed: name.
Step 3 — Customer wants to book. Needed: name + confirmation contact.
```

**Runtime check before asking for any field:**
```
1. Do we already have this information from earlier in the conversation?
2. Is this field required for the specific next action?
3. Does the customer understand why we need it?

Only ask if all three conditions pass.
```

```
Wrong:   "We just need a few details."
Correct: "I'll send the recommendation there — what's the best email?"
```

---

### 3.2 Channel Context Rules

Data collection adapts based on the channel the conversation is happening on. The agent never asks for information the channel has already provided.

```
WEBSITE CHAT: Usually anonymous. Email or phone collected at natural
              trigger moment.
SMS:          Phone number already exists from the channel. Do not ask
              for phone number. Confirm only if the transaction
              specifically requires re-verification.
EMAIL:        Email address already exists from the channel. Do not ask
              "what's your email?" Confirm only if sending to a
              different address.
WHATSAPP:     Phone number exists from channel. Do not re-ask.
```

**Rule:** Available channel identity counts as Tier 1 Passive Capture. Do not create friction by asking for what the channel already provided.

---

### 4. Per-Archetype Collection Mapping Table

| Archetype | Primary Tier | Secondary Tier | Exact Trigger Moment | Special Rules |
|---|---|---|---|---|
| Commerce (Ecom) | Tier 2 | Tier 3 | Cart-save offer after clear product interest/preference is expressed | Never ask upfront; gift purchases may require a second Tier 3 capture for the recipient, framed separately from the buyer's info |
| Commerce (Restaurant) | Tier 3 | Tier 1 | Reservation confirmation moment — name required to hold the table | If customer volunteers email/phone earlier for a question, capture passively (Tier 1) and don't re-ask at Tier 3 |
| Appointment | Tier 2 | Tier 3 | Slot confirmation offer once a specific time is being considered | Special requests (allergy, accessibility) are collected alongside Tier 3 fields, not as a separate ask |
| Emergency | Tier 3 | — | Immediately, as part of triage/routing | Urgency and safety context make upfront collection natural — this is the one archetype where Tier 2's "earn it first" logic does not apply |
| Consultation | Tier 2 | Tier 3 | Summary offer after discovery has produced real insight, not before | Never collect contact info to "keep the lead" before discovery has produced anything of value to summarize |
| Engagement | Tier 2 | Tier 3 | Program-match offer once a specific contribution type (donate/volunteer/attend) is identified | Mission-aligned framing required — the ask must read as helping the customer act on their interest, not as list-building |

### 4.1 System Lead Creation Rules

Customer-facing data collection and internal lead record creation are separate concepts. The system creates records silently behind the scenes. The customer never sees this and it never interrupts their conversation.

**Reference:** Field names and payload standards must align with `INTEGRATION_CONTRACT_v1.md` (`06_Infrastructure/Integration/`) — use exact field names defined there. Field names below (`lead_id`, `customer_name`, `customer_email`, `customer_phone`, `business`, `service`, `intent`, `conversation_summary`) are quoted directly from that contract.

**Three internal record stages:**

```
ANONYMOUS INTERACTION RECORD
Created: When conversation starts.
Contains: session ID, intent, source channel, conversation history.
No customer contact info required.
No lead_id assigned yet — this stage precedes the official Lead Record
defined in the Integration Contract.

---

SOFT LEAD RECORD
Created: When Tier 2 capture completes.
Contains: lead_id (assigned at creation), business, customer_email OR
customer_phone (whichever was captured), intent, conversation_summary.
Lead Status: "New" (per Integration Contract allowed values).

---

CONVERSION LEAD RECORD
Created: When Tier 3 capture completes.
Contains: lead_id, business, customer_name, customer_email AND/OR
customer_phone, service, plus archetype-specific transaction fields
(e.g., preferred_date / preferred_time for booking types, per the
Booking/Conversion Payload Standard).
Lead Status updates to "Converted". A linked Conversion Record
(conversion_id) is created with Conversion Status "Pending" until the
transaction is confirmed downstream.
```

**Rule:** Never expose internal record-creation logic to the customer. The customer journey drives collection. The system records what is collected. The system never waits for fields the customer hasn't provided yet.

### 5. Universal Prohibitions

These are absolute. No exceptions, regardless of archetype, configuration, or freedom level.

```
The agent NEVER:
1. Asks for name, email, or phone in its first response to a new
   conversation.
2. Asks for all three contact fields (name + email + phone) in a single
   turn.
3. Blocks the customer from continuing the conversation until contact
   info is provided (no "I can't help you until I get your email").
4. Asks for contact info in a support or complaint context before the
   issue itself has been acknowledged and addressed.
5. Re-asks for a field the customer has already provided earlier in the
   same conversation.
6. Collects a field it has no immediate, stated use for ("just in case"
   collection).
7. Frames contact-info collection as required when it is actually
   optional to the customer's immediate goal.
```

### 6. Edge Cases to Handle

```
EDGE CASE: Customer volunteers email before agent asks
  Handling: Treat as Tier 1. Acknowledge naturally, do not escalate into
  a formal capture moment, do not request additional fields.

EDGE CASE: Customer refuses to give phone number
  Handling: Accept the refusal. Offer the best available alternative
  (email only, or proceed without contact info if the transaction allows
  it). Never pressure or repeat the request. Never block the underlying
  goal (booking/purchase/support) solely because one field is withheld,
  unless that field is strictly required to complete the transaction
  (e.g., emergency dispatch) — in which case the agent explains why it's
  required, once, without pressure.

EDGE CASE: Customer gives email in wrong format
  Handling: Flag it plainly and ask for correction once ("that email
  looks like it might be missing something — mind double-checking it?").
  Do not silently accept invalid data, and do not interrogate the
  customer about it.

EDGE CASE: Customer says "I'll give you my info later"
  Handling: Accept it immediately, without pushback or repeated asks.
  Continue the conversation toward the customer's actual goal. Re-offer
  the same Tier 2/3 exchange only if a new natural trigger moment occurs
  later — never as a follow-up nag.

EDGE CASE: Returning customer whose info is already on file
  Handling: Do not re-ask for fields already on record (Level 2 Customer
  Memory takes priority — see Step 0C). Confirm only if the specific
  transaction requires re-verification (e.g., confirming a phone number
  for a time-sensitive callback).

EDGE CASE: Support conversation where customer has not bought yet
  Handling: Resolve the support/FAQ need first. Do not introduce any
  Tier 2 value-exchange offer until the original question is fully
  answered — introducing a capture moment mid-support reads as
  opportunistic and damages trust.
```

---

### 7. Data Validation Before Backend Submission

The agent never passes data to any backend system (n8n, Airtable, booking API, cart API) until that data has passed format validation. Collecting the field and validating the field are two separate steps. A collection that fails validation is not complete — the field is treated as not-yet-collected until a valid value is confirmed.

This applies to every field collected under Tier 2 or Tier 3 (Step 0B Sections 3 and 4). Tier 1 (Passive Capture) fields are validated silently — if a passively-captured value is malformed, it is held but not acted on until a validation trigger occurs naturally.

---

#### 7.1 Field Validation Rules

```
EMAIL ADDRESS
  Valid format: contains exactly one "@", a domain with at least one
  ".", no spaces, no consecutive dots, TLD present.
  Examples of invalid: "john@", "john.gmail.com", "john @gmail.com",
  "john@gmail"
  Agent behavior on invalid: Flag once, plainly.
    "That email looks like it might be missing something —
     could you double-check it?"
  If customer corrects: re-validate before accepting.
  If customer insists the invalid format is correct: accept with an
  internal flag (validation_flag = true on the record) and escalate
  the record to human review rather than blocking the customer's
  goal. Never hold the entire conversion hostage to one field.
```

**Typo-correction suggestion (addition, distinct from format validation
above):** Beyond catching structurally invalid formats, the agent
recognizes common plausible typos and suggests a correction rather than
only flagging "invalid":
```
Common patterns to recognize:
  - Missing/extra character in a well-known domain (gmial.com, gmai.com
    → suggest gmail.com)
  - Common TLD typos (.con, .cmo → suggest .com)
  - Stray space within the address
  - Missing "@" where the intended structure is otherwise clear

Agent behavior: "That looks like it might be missing something —
did you mean [corrected version]?" — a specific suggested correction,
not just a generic "please re-check" prompt.
```
This is distinct from the fake-but-valid-format case (e.g., test@test.com)
accepted as an open gap in the Stress Test Library — that case has no
detectable typo to correct, since the format is fully valid. This addition
only handles cases where a real, identifiable typo exists.

```
PHONE NUMBER
  Valid format: depends on country code configuration (see Section 7.2).
  General rules:
    - Digits only after country code (no letters, no repeated symbols)
    - Minimum 7 digits, maximum 15 digits (ITU-T E.164 standard)
    - No sequences of the same digit repeated 7+ times
      (e.g., "1111111" is likely a placeholder, not a real number)
    - Extensions (x123) noted separately, not merged into the number
  Agent behavior on invalid: Same one-flag pattern as email.
    "That number doesn't look quite right — could you re-enter it?
     Just the digits are fine."

NAME (for booking/reservation confirmation)
  Valid: At least 2 characters, at least one letter, no pure numeric
  input accepted as a name.
  Invalid patterns: "1234", single character, emoji-only.
  Agent behavior: Accept freely — names are diverse; only reject clear
  non-names. Do not correct spelling.

DATE / TIME
  Valid: Requested date is in the future (not past), within a
  reasonable booking horizon (default: within 12 months, configurable
  per client as `max_booking_horizon`).
  Invalid: Past dates, impossible dates (February 30), dates beyond
  the booking horizon.
  Agent behavior on past date:
    "Just checking — did you mean [next occurrence of that day/date]?"
    Not: "Invalid date." Never robotic.
  Agent behavior on impossible date:
    "That date doesn't seem to exist — did you mean [nearest valid
     date]?" Offer the correction, don't just reject.

POSTAL CODE / LOCATION (Emergency archetype primarily)
  Valid: Matches expected format for the configured service region
  (e.g., 5-digit US zip, UK postcode format if applicable).
  Agent behavior on mismatch: Ask for clarification once.
    "Could you confirm the area — I want to make sure we can reach
     you."
  If the second attempt (re-ask) also fails to produce a parseable
  location:
    Apply the same accept-with-flag pattern as Email/Phone (Section
    7.3 Step 5b): accept the best available description as
    validation_flag = true, and — because location is safety-relevant
    in Emergency specifically — do NOT block dispatch on this alone.
    Instead: proceed to Callback Queue creation (Module 3 Emergency
    Mode A) with the unparsed location text attached as-is, and mark
    the record for immediate human review before or during dispatch
    (Priority 1, per Module 1 Section D) rather than holding the
    customer in a repeated-clarification loop during a possible
    active emergency.
    For non-Emergency archetypes, the standard Section 7.4 Backend
    Submission Gate applies (INVALID-FLAGGED, human review, proceed).
  Out-of-zone detected via location: per Step 4 Emergency Section 5
  (Out-of-Zone branch) — not a validation failure, a routing decision.
```

---

#### 7.2 Country Code Handling

Phone number country codes are handled based on business configuration, not inferred by the agent independently.

```
CONFIGURATION A — Single-region business (default)
  Business config contains: `default_country_code` (e.g., +1, +44, +880)
  Agent behavior: Automatically prepends the configured country code
    when the customer provides only a local number (no country code
    included). Agent does NOT ask for country code — it is assumed.
  Agent may say (if helpful): "I'll save that as [+1 XXX-XXX-XXXX] —
    does that look right?"

CONFIGURATION B — Multi-region or global business
  Business config: `default_country_code` is absent or set to "ASK"
  Agent behavior: Ask for country code as part of phone collection.
    "What's the country code for your number? (e.g., +1 for US,
     +44 for UK)"
    Or if the customer's region is known from context (location field
    already collected): suggest it.
    "Are you in [country]? I'll use [+XX] — let me know if
     that's different."
  If customer provides number with country code already included:
    agent validates the format as a whole and does not re-ask.

CONFIGURATION C — Country inferred from context
  If the customer's location/region is already known from earlier in
  the conversation (e.g., location collected in Emergency triage),
  the agent may infer the likely country code from that location and
  confirm rather than asking cold.
    "Since you're in [area], I'll use [+XX] — is that right?"

Rule: The agent never silently assumes a country code when multi-region
  config is active. Silent assumption creates real dispatch/delivery
  failures when the assumed code is wrong.
```

---

#### 7.3 Correction Flow Rules

The agent follows a strict one-attempt correction pattern. This is consistent with Step 0B's Universal Prohibitions (never re-ask repeatedly) and Step 0A's Customer Patience Window constraints.

```
Step 1: Field collected.
Step 2: Validation runs immediately (before any other question).
Step 3a: IF valid → continue conversation normally.
Step 3b: IF invalid → flag once, specifically and plainly.
          State what seems wrong (not just "that's invalid").
          Suggest the correction if obvious (missing @, wrong digit
          count, past date).
Step 4: Customer provides corrected value → re-validate.
Step 5a: Corrected value valid → continue.
Step 5b: Customer insists invalid value is correct, OR provides
          second invalid value → apply graceful-persistence rule:
          "No problem — I'll note that and someone may follow up
           to confirm." Accept the field with an internal flag.
          Do not block the conversation. Do not ask a third time.
```

**Rule:** Correction flow is one ask, one re-attempt. After that, accept with a flag and continue. The customer's time and trust are more valuable than a perfect database record.

---

#### 7.4 Backend Submission Gate

No field is passed to any backend system until it clears validation. This applies to all downstream systems: n8n workflows, Airtable record creation, booking APIs, cart APIs, dispatch queues.

```
Validation state per field:
  VALID:          Passes to backend normally.
  INVALID-FLAGGED: Passes to backend with validation_flag = true.
                   Human review triggered on the receiving record.
                   No automated action taken on flagged records
                   until a human confirms or corrects the field.
  NOT-YET-COLLECTED: Field not submitted to backend at all.
                     The backend action waits (stays in
                     DATA_COLLECTION state per Module 3 Section 1.1)
                     until the field is collected and validated.
```

**Connection to Conversion State Machine (Module 3 Section 1.1):** The transition from DATA_COLLECTION → ACTION_PENDING does not fire until all required fields for the specific conversion mode are in VALID or INVALID-FLAGGED state. A NOT-YET-COLLECTED required field blocks the state transition entirely.

**Integration Contract v2 additions required:** `validation_flag` (boolean, per field or per record), `validation_notes` (text — which field flagged and why).

---

## STEP 0B COMPLETION SUMMARY

- **Decisions made:**
  - Emergency was defined as Tier 3-only with no Tier 2 step, consistent with the Execution Plan's explicit note that "urgency justifies immediate collection" — Tier 2's earn-it-first logic is structurally skipped, not just rarely used.
  - Commerce (Restaurant) was given Tier 3 as primary (not Tier 2) because the reservation itself requires a name to hold the table — this differs from Ecom, where Tier 2 (cart save) is primary and purchase/checkout is a separate, later Tier 3 moment.
  - Gift purchase (Commerce/Ecom) was treated as requiring a second, separately-framed Tier 3 capture for the recipient — flagged in Step 0A as an edge case, resolved here as: buyer's info and recipient's info are captured as two distinct moments, not merged into one ask.
  - The "special requests" (allergy, accessibility, dietary) collection for Appointment was bundled into the Tier 3 moment rather than given its own tier, since these are naturally gathered alongside booking completion, not before.
- **Open questions:**
  - Consultation's Tier 2 trigger ("summary offer after discovery has produced real insight") is intentionally qualitative — Step 4 (Consultation Archetype) will need to define more precisely what counts as "enough discovery" to avoid the agent either asking too early (feels like lead-gen) or too late (customer has already lost patience, per the Long-but-conditional Patience Window defined in Step 0A).
  - Restaurant Tier 1 passive-capture interaction with Tier 3 (if a customer gives email early for a menu question, then later needs to give name at booking) — this doctrine says don't re-ask fields already given, but email and name are different fields, so no actual conflict; flagging only for architect confirmation that this reasoning is correct.
  - Emergency's single-tier design means there is no defined "soft" collection path if a customer resists giving a phone number despite the safety justification — current edge-case handling (explain once, no pressure) applies, but architect should confirm this is acceptable even in Emergency where the missing field could delay dispatch.
- **Additions applied:** Progressive Profiling Rule / Channel Context Rules / System Lead Creation Rules
- **Restaurant Tier 1 + Tier 3 non-conflict confirmed** — email and name are different fields, no contradiction.
- **Batch 3 Round 4 (Business Logic Hardening) applied:** Section 7.1's EMAIL ADDRESS validation now includes a Typo-Correction Suggestion (Patch 9 Part 4) — distinct from format validation, recognizes plausible domain/TLD typos and suggests a specific correction rather than a generic re-check prompt. Explicitly does not resolve the separate fake-but-valid-format gap (e.g., "test@test.com") already documented as an open Stress Test Library finding — that case has no detectable typo to correct.
- **Ready for architect review:** YES

---

## STEP 0C — Context & Memory Boundary System

This section defines what types of information the agent holds, how much it trusts each type, and how conflicts are resolved. It governs every module and archetype — no flow built in later steps may contradict it.

### 1. The Core Problem

Enterprise agents need memory to feel competent rather than robotic — repeating a question the customer already answered, or failing to recognize a returning customer, reads as incompetence. But uncontrolled memory is just as damaging as no memory. Two distinct failure modes exist, and they must be solved separately, not treated as one problem:

**Remembering context** is the act of retaining information the agent has been given — a stated preference, a past purchase, a business policy. This is necessary and, done well, is invisible: the agent simply doesn't make the customer repeat themselves.

**Making decisions based on outdated context** is a different and more dangerous failure — it is treating remembered information as still true and still authoritative *right now*, without checking whether it still is. A customer's past preference may have changed. A product they bought before may be discontinued. A policy that applied last month may have been updated. Memory that is retained correctly but *applied* without a currency check produces confident, articulate, wrong answers — which are more damaging to trust than an agent that simply didn't remember, because they actively mislead rather than merely underperform.

The runtime must therefore treat "do we have this information" and "is this information still the right basis for a decision right now" as two separate questions, answered in that order, every time memory is used. Uncontrolled memory also creates privacy and relational risk beyond accuracy: referencing information in a way that feels surveilled (frequency counts, behavioral inference) damages trust even when the information is accurate and current.

### 2. Three Memory Levels

---

#### LEVEL 1 — Session Memory

**Scope:** Information that exists only within the current, live conversation — preferences mentioned today, the current product/service under discussion, the current objection, the current conversation goal.

**Source:** Directly stated or clearly implied by the customer in this conversation.

**Trust level:** High, but conversation-scoped only. The agent can rely on it completely for the duration of this conversation, but it carries zero authority once the conversation ends — it does not persist as fact into the next interaction unless promoted to Customer Memory through an explicit record (e.g., a saved preference field).

**Usage rules:** Agent may use freely and immediately, without hedging or re-confirming, for the remainder of the current conversation. Must not be assumed to still apply if the customer returns in a new session days later — that requires Level 2 promotion first.

**Example of correct use:**
```
Customer: "I like the blue one."
Later, same conversation: Agent understands "the blue one" refers to the
product discussed earlier, without asking the customer to repeat it.
```

**Example of incorrect use:**
```
Same customer, three days later, new conversation:
Agent: "So, still interested in the blue one?"
Wrong because: session memory does not survive the session. This
preference was never promoted to Customer Memory, so treating it as
still true is an unverified assumption, not a fact.
```

---

#### LEVEL 2 — Customer Memory

**Scope:** Known history about this specific customer across time — previous purchases, previous bookings, past support issues, saved preferences, summaries of previous conversations.

**Source:** Business systems of record (per the Integration Contract: Airtable-held Lead/Conversion/Recovery records, `conversation_summary` fields, and any saved preference fields) — never the agent's own inference.

**Trust level:** Medium-High, but always subordinate to current Business Memory (Level 3) and always understood as "true as of when it was recorded," not "true right now."

**Usage rules:** Agent may reference customer history to improve the experience — e.g., recognizing a returning customer, resuming a support issue — but must do so carefully, never in a way that feels invasive, and must verify currency against Level 3 before acting on it (e.g., before assuming a previously purchased product is still available).

**Example of correct use:**
```
"Looks like you've purchased from us before — I can help with that order."
```

**Example of incorrect use:**
```
"I see you viewed this product 7 times last month."
Wrong because: this is invasive surveillance-style disclosure, not
customer-service use of history — see Privacy Boundaries below.
```

**Forward-looking note (not a current requirement):** Customer Memory
(Level 2) as defined above is intentionally scoped to session-bounded and
lightly-persisted customer history — sufficient for the current build.
A future architectural direction may back this level with a richer
long-term intelligence layer (Zeromanual's "Company Brain" concept:
long-term customer intelligence feeding recommendation and prediction).
This document does not require that integration now — Level 2's existing
definition, trust rules, and Memory Freshness Rules (§3.1) remain fully
sufficient and unchanged. When/if a richer backing store is adopted, it
replaces *what's behind* Level 2, not the rules governing how Level 2 is
used — those rules (source-authority priority, freshness windows, privacy
boundaries) apply identically regardless of what system stores the data.

---

#### LEVEL 3 — Business Memory

**Scope:** Company rules and current knowledge — products, services, pricing rules, policies, availability, SOPs, active configuration and capability flags.

**Source:** Business configuration and knowledge base (Airtable Business Config / Business Context, per the Integration Contract) — the single current-state source of truth.

**Trust level:** Highest authority in the system. Business Memory always wins when it conflicts with anything else, because it is the only memory level that is guaranteed to reflect the present, not the past.

**Usage rules:** Agent must never override current business data with assumptions, customer history, or session-stated beliefs. If Business Memory is silent on something, the agent says so rather than inferring from a lower-priority source.

**Example of correct use:**
```
Customer previously bought Product A. Product A is now discontinued per
Business Memory.
Agent: follows current business data ("Product A has actually been
replaced by Product B — here's what's different") rather than assuming
Product A is still available because the customer bought it before.
```

**Example of incorrect use:**
```
Agent quotes a price from a customer's memory of "what it cost last
time" without checking current Business Memory pricing.
Wrong because: this lets stale Customer Memory override current
Business Memory — exactly backwards from the required priority order.
```

### 3. Memory Conflict Resolution

**Priority order when levels conflict:**

```
Business Memory
↓
Current Session Information
↓
Customer History
↓
Agent Assumption
```

Agent Assumption is never a legitimate independent source — it sits at the bottom only to make explicit that when no memory level actually answers the question, the agent must say so rather than fabricate an answer that sounds like it came from one of the three real levels.

**Worked example — Session memory contradicts customer history:**
```
Customer History (Level 2): Customer's saved preference is "vegetarian."
Current Session (this conversation): Customer says "I'll have the
steak tonight."
Resolution: Current session information outranks customer history.
Agent proceeds with the steak order — a saved preference is not a
permanent rule, and treating it as one would override the customer's
explicit, current statement. Agent may optionally, lightly note the
mismatch once ("noted — different from your usual vegetarian order,
just confirming that's correct") without blocking the request.
```

**Worked example — Customer history contradicts business rules:**
```
Customer History (Level 2): Customer previously received a discount
code that no longer exists in current promotions.
Business Memory (Level 3): Current active promotions do not include
that discount.
Resolution: Business Memory wins. Agent does not honor the old
discount from memory. Agent explains current available offers rather
than silently applying outdated ones.
```

**Worked example — Agent assumption contradicts any memory level:**
```
No memory level states the customer's budget. The agent is tempted to
infer a budget from the price range of products previously viewed.
Resolution: This inference is an Agent Assumption, not a fact from any
of the three memory levels, and sits at the bottom of the priority
order. Agent must ask directly rather than act on the inferred budget
as if it were known.
```

### 3.1 Memory Freshness Rules

Customer Memory loses reliability over time. The agent must consider whether information that was true when recorded is still a valid basis for a decision now. Freshness does not delete memory — it changes how confidently the agent acts on it.

```
FRESH MEMORY (0–30 days)
Can be referenced naturally without confirmation.
Example: "Following up on your recent appointment request..."

WARM MEMORY (1–12 months)
Reference lightly. Confirm currency before acting on it.
Example: "Looks like you previously looked at [service]. Still
interested in something similar?"

COLD MEMORY (12+ months)
Do not assume relevance. Use only as historical context, never as
the basis for an assumption about what the customer currently wants.
Example:
  Wrong:   "Ready to continue your project?"
  Correct: "I see we've connected before. How can I help today?"
```

**Archetype-specific windows:**
```
Emergency:     Issues go cold quickly — a past emergency is rarely
               still active.
Consultation:  Business goals may stay relevant longer if explicitly
               recurring.
Appointment:   Service preferences often stay warm longer (recurring
               personal care).
```

### 3.2 Memory Creation Rules

Not every detail from a conversation becomes Customer Memory. Session Memory is promoted to Customer Memory only when there is a clear, durable business reason to retain it.

**Allowed to save:**
```
- Explicit stated preferences: "I always prefer morning appointments."
  → Save: appointment_preference = morning

- Completed transaction history: purchases, bookings, consultations,
  registrations

- Support context with future relevance: "I had an issue with my last
  order."
  → Save: support_flag + summary of issue type
```

**Do not save:**
```
- Temporary states: "I'm in a hurry today."
  → Do not convert to: "Customer always wants fast service."

- Temporary constraints: "I need the cheapest one this time."
  → Do not convert to: "Budget customer."

- Emotional moments: "I'm frustrated right now."
  → Do not save the emotion or convert to "difficult customer."
  → DO save if a formal complaint or refund event occurred — save the
    event as a factual support record, not as a character judgment.
```

**Core rule:** Save facts and completed events. Never save interpretations, inferences, or temporary states as permanent attributes.

### 4. Privacy Boundaries

The agent must never reference the following, even when the underlying data technically exists in a system of record:

```
1. Browsing behavior (pages viewed, items clicked, time spent looking
   at something) — this is tracking-style data, not conversational
   history, and disclosing it reads as surveillance.
2. Frequency or count data ("you've viewed this 7 times," "you've
   messaged us 4 times this week") — even when accurate, stating a
   count turns a helpful memory into an uncomfortable one.
3. Personal inferences beyond stated facts (inferring income level,
   relationship status, health conditions, or other personal
   attributes the customer did not explicitly state).
4. Sensitive prior interactions surfaced in unrelated new
   conversations (referencing a past complaint, refund dispute, or
   personal/health-adjacent booking detail when the current
   conversation has nothing to do with it).
```

**Rule:** Memory should make the customer feel *known*, never *watched*. If referencing a piece of remembered information would make a reasonable customer uncomfortable if they realized it had been tracked, it does not get referenced — even if it would technically make the agent's response more "personalized."

### 4.1 Shared Identity Handling

Some contact records represent more than one person. Examples: family account, company account, assistant booking on behalf of someone else, gift purchase.

The agent must not assume the current user is the same person as the historical record holder, just because they share a contact method.

```
Wrong:   "Welcome back, Sarah." (when Sarah's assistant is messaging)
Correct: "Looks like there's an existing account connected here. How
         can I help today?"
```

**Rule:** Confirm identity naturally before using personal history. Use contact method (email/phone/account ID) to match the record. Use the name the current user provides in this conversation (Session Memory), not the name on the historical record, until the current user confirms they are the same person.

### 5. Memory Edge Cases

```
EDGE CASE: Customer denies a prior purchase that is on record
  Handling: Do not argue or assert the record as an unquestionable
  fact back at the customer. Business/Customer Memory informs the
  agent's own understanding, but the agent proceeds gracefully
  ("no problem — let's start fresh with what you need today") rather
  than contradicting the customer. Flag the discrepancy internally if
  the distinction matters for the current task (e.g., a support
  claim), rather than debating it conversationally.

EDGE CASE: Customer references a conversation the agent has no memory of
  Handling: Do not fabricate recall. Say so plainly ("I don't have that
  conversation on file — can you fill me in?") and proceed from what
  the customer provides now (Session Memory) rather than guessing.

EDGE CASE: Business config has changed since customer's last visit
  Handling: Business Memory (Level 3) always reflects current state by
  definition — the agent must load and apply current config, not the
  config that was active during the customer's last recorded
  interaction. This is the core "outdated context" failure mode named
  in Section 1 — the agent remembers the customer visited before, but
  must not decide based on what was true back then.

EDGE CASE: Discontinued product in customer's history
  Handling: Per the Level 3 worked example above — acknowledge the
  customer's prior interest, but follow current Business Memory for
  what's actually available now. Never let Customer Memory imply
  something is still purchasable when Business Memory says otherwise.

EDGE CASE: Customer uses a different name than on record
  Handling: Do not correct or challenge the customer over the
  discrepancy. Use the name the customer is currently presenting for
  the conversation (Session Memory takes precedence for the
  interaction itself), while the underlying record match can still be
  handled by contact method (email/phone) rather than name. Never
  block service on a name mismatch alone — names are not reliable
  unique identifiers (nicknames, married names, typos).
```

---

## STEP 0C COMPLETION SUMMARY

- **Decisions made:**
  - Structured the Core Problem section around the architect's explicit framing — "remembering context" vs. "making decisions based on outdated context" — as two distinct failure modes rather than one, since the second is the more dangerous and less obvious of the two.
  - Anchored Level 2 (Customer Memory) and Level 3 (Business Memory) sourcing to the actual Integration Contract record structure (Lead/Conversion/Recovery records, Business Config/Business Context in Airtable) rather than describing memory abstractly, so this section stays consistent with Step 0B's System Lead Creation Rules (4.1) and the platform-independent data model already in use.
  - Treated "Agent Assumption" in the conflict-resolution priority order as a non-source — explicitly defined as what's left when none of the three real memory levels answer the question — to prevent it from being read as a legitimate fourth tier the agent can lean on.
  - Privacy Boundaries were written as absolute (no conditional exceptions), consistent with how Universal Prohibitions were handled in Step 0B — privacy violations are a trust-breaking category, not a judgment call.
- **Open questions:**
  - The Integration Contract does not yet define a formal schema for "saved preferences" as a Customer Memory field (only conversation_summary and the core contact/transaction fields are defined) — architect should confirm whether preference persistence (e.g., the vegetarian example in Section 3) needs a new field added to the contract, or whether it's meant to live entirely inside conversation_summary text.
  - Business config change detection (Edge Case: "Business config has changed since customer's last visit") assumes the runtime always loads current config fresh per conversation — this is stated as a requirement here, but the actual load mechanism belongs to Step 1C (Configuration Load) and should be cross-checked for consistency once that section is written.
  - No explicit guidance yet on how long Customer Memory (Level 2) should be considered relevant before it's treated as too stale to reference at all (e.g., a purchase from 3 years ago vs. 3 weeks ago) — flagged for architect input, possibly an archetype-specific staleness window rather than a universal one.
- **Additions applied:** Memory Freshness Rules / Memory Creation Rules / Shared Identity Handling
- **Memory age open question resolved by Section 3.1 Freshness Rules.**
- **Config reload per session confirmed as a requirement — to be enforced explicitly in Step 1C.**
- **Saved preferences schema flagged for Integration Contract update — not to be stored in conversation_summary text.**
- **Batch 3 Round 4 (Data Architecture & Cleanup) applied:** Level 2 (Customer Memory) now includes a Forward-Looking Note (Patch 8) confirming — not changing — that Level 2's current scope is sufficient today, with Zeromanual's future "Company Brain" long-term-intelligence concept named as a possible future backing store. Level 2's existing definition, trust rules, and Memory Freshness Rules (§3.1) remain unchanged.
- **Ready for architect review:** YES

---

## STEP 1 — Universal Runtime Layer

This is the single thinking engine that every customer message passes through, regardless of archetype or configuration. It is always active. It cannot be disabled.

**Governing constraint for this entire step:** The runtime does not decide what the agent is capable of. Configuration decides. The runtime's job is to classify, load, and route correctly — never to improvise a capability that configuration has not explicitly turned on. Every routing decision below resolves to an explicit YES branch and an explicit NO/fallback branch. No path terminates without a defined next action.

---

### 1.0 Universal Runtime Loop

Every customer message follows the same execution cycle. The loop repeats for every new customer message without exception.

```
MESSAGE RECEIVED
↓
Load Current Session (1A)
↓
Identify Customer State (1A)
↓
Classify Intent (1B)
↓
Load Current Configuration (1C)
↓
Route To Allowed Module (1D)
↓
Action Permission Check (1D.1)
↓
Confidence Gate (1D.2)
↓
Check Intent Priority Changes (1E)
↓
Resolve Multiple Intents If Present (1F)
↓
Generate Response / Action
↓
Update Memory + System Records
↓
Conversation Exit Check (1G)
↓
WAIT FOR NEXT MESSAGE → loop restarts
```

The runtime never exits this loop until the conversation ends. Every new message is treated as a fresh opportunity to detect changed intent, update context, apply current configuration, and prevent stale assumptions from the previous turn.

---

#### 1.0.1 External Event Entry Point

Not all agent activity begins with a customer message. External system events — webhooks, scheduled triggers, platform notifications — must also enter the runtime through a defined path, not float as undefined triggers inside individual modules.

```
EVENT RECEIVED (external trigger)
↓
Classify Event Type:
  SCHEDULED_TRIGGER — cadence step firing (Recovery Engine, reminder)
  PLATFORM_WEBHOOK  — cart abandoned, payment failed, booking changed,
                      form submitted, review posted
  SYSTEM_ALERT      — API failure, config change, human task closed
↓
Load Business Config (same as 1C — always current state)
↓
Identify Affected Customer (by contact method / order ID / session ID)
↓
Check Global Active Issue Lock (Module 5, Section 2.9):
  Customer has active human ownership? → Queue event, notify human
  Customer has active live conversation? → Surface as context, pause
  No active lock? → Route to the appropriate module for this event type
↓
Module handles event per its own logic
(Recovery Engine cadence, Email Manager outbound,
 Conversion Engine lifecycle update, etc.)
↓
Update System Records
↓
Event processing complete — no conversation loop unless event
produces a customer-facing message that triggers a reply
```

**Rule:** Externally-triggered events and customer-initiated messages use the same permission, memory, and config rules. The entry point differs; the decision architecture is identical.

---

### 1A. Session State Check

Before any intent detection, the agent determines who it is talking to. This check runs first, before Intent Classification (1B), because the correct starting behavior differs by session state even for the same message.

---

#### NEW USER

**Definition:** No session history exists. No prior data of any kind — no Customer Memory record, no active session.

**How agent detects it:** No matching Customer Memory record (Level 2) by contact method, session token, or channel identity (per Step 0C Section 4.1, matched by contact method — never by name alone), and no active session state.

**Starting behavior difference:** Full greeting + intent detection from a blank slate. No assumptions are made about need, history, or preference.

**What data is loaded:** Business Memory (Level 3) only — current config, KB, policies. No Customer Memory exists to load.

**What agent must NOT do:**
```
- Must not greet as if returning ("Welcome back!")
- Must not reference any prior activity — there is none
- Must not skip discovery on the assumption of a known preference
```

---

#### RETURNING LEAD

**Definition:** A prior conversation exists (a Soft Lead Record or Anonymous Interaction Record per Step 0B Section 4.1), but it did not convert — no completed transaction on record.

**How agent detects it:** Customer Memory match (by contact method) to an existing Lead Record with Lead Status other than "Converted" — i.e., "New," "Qualified," or "Escalated."

**Starting behavior difference:** Load prior context and acknowledge it lightly, without being presumptive or invasive (per Step 0C Freshness Rules — treat the prior interaction's recency per Section 3.1: Fresh/Warm/Cold). Recovery Engine may already be active on this lead; if so, this conversation may be a response to a recovery touchpoint.

**What data is loaded:** Business Memory (current) + Customer Memory (prior intent, conversation_summary, stated preference if saved per Step 0C Section 3.2).

**What agent must NOT do:**
```
- Must not restart discovery from zero if the prior context is still
  Fresh (0–30 days) and clearly relevant
- Must not assume the prior interest is still current if memory is
  Warm or Cold (Step 0C 3.1) — confirm lightly instead
- Must not treat this as a brand-new Lead Record — update the existing
  one, do not duplicate
```

---

#### EXISTING CUSTOMER

**Definition:** Has at least one prior conversion on record (a Conversion Lead Record, Lead Status "Converted," per Step 0B Section 4.1).

**How agent detects it:** Customer Memory match to a Lead Record with Lead Status "Converted," or a linked Conversion Record.

**Starting behavior difference:** Support mode takes priority over sales mode by default. The agent does not open with a sales or discovery posture — it opens ready to assist with something related to the existing relationship, while remaining open to a new need.

**What data is loaded:** Business Memory (current) + full Customer Memory (transaction history, prior service/product, any open support flags).

**What agent must NOT do:**
```
- Must never sell before resolving an active issue, if one exists
  (see Step 1D routing — support/complaint/refund/human-request
  intents always route to Core Agent Support Mode regardless of other
  active modules)
- Must not treat the customer as new or re-run full discovery for a
  need type they've already completed before, without checking
  Customer Memory first
- Must not assume the specific product/service from their history is
  still relevant or available without checking Business Memory
  (Step 0C Level 3 priority)
```

**DORMANT CUSTOMER (sub-state of Existing Customer):**
```
Definition: An Existing Customer whose last conversion record
  exceeds the archetype-specific reactivation threshold (per
  Module 4 Section 8, Source H: Commerce 90 days / Appointment
  60 days / Consultation 6 months / Engagement 30 days).

How agent detects it: Existing Customer status confirmed AND
  last_conversion_date > reactivation_threshold (Business Memory).

Behavioral difference from active Existing Customer:
  - Do not assume prior service/product preference is still
    current (Cold Memory per Step 0C Section 3.1 applies).
  - Open with a light re-introduction rather than assuming
    full context continuity.
  - Do not surface stale service history as if it's recent.

Recovery Engine implication: If Recovery Engine is active,
  a Dormant Customer may already have a reactivation record
  (Module 4 Source H) — check for this before treating the
  conversation as purely organic.
```

**CONCURRENT SESSION DEDUPLICATION RULE**

If a customer opens two simultaneous sessions (e.g., mobile chat and desktop chat at the same time, or two browser tabs):

```
Detection:
  Same customer identity (matched by contact method, per Step 0C
  Section 4.1) has two active session tokens within a configured
  concurrency window (default: sessions within 5 minutes of each
  other with no explicit close signal between them).

Behavior:
  The system does not process both sessions independently —
  this would result in two simultaneous AI conversations with
  the same person, potentially giving contradictory answers
  or taking duplicate actions.

  Primary session: The earlier-opened session continues normally.
  Secondary session: Acknowledge and redirect.
    Agent message: "Looks like you may already have a conversation
    open with us — to avoid any confusion, I'd suggest continuing
    there. Is there something specific I can help with here?"

  If the primary session cannot be confirmed (customer cleared
  cookies, different device, unclear identity match):
    Apply Probable Match tier from Step 0C Section 4.1 /
    Module 5 Section 2.7 (Channel Identity Resolution) —
    proceed with caution, do not assume it's the same person,
    do not merge without confirmation.

  Exception: If the secondary session arrives with a different
    intent that the primary session clearly isn't addressing
    (e.g., primary is a support chat, secondary is a new
    booking inquiry), flag the secondary to the human queue
    (Priority 3 — Review) rather than blocking it outright.
```

---

### 1B. Intent Classification

Every message is classified before routing. Classification happens on every message, not just the first — see 1E for how classification interacts with mid-conversation intent changes.

```
INTENT 01 — INFORMATION SEEK
Definition: Customer wants to understand something — no problem stated,
no solution requested yet.
Examples:
  "What do you offer?"
  "How does this work?"
  "What's the price?"
Signals: Early-stage curiosity, Exploring buying-readiness (Step 0A).
Priority level (1E): 6

---

INTENT 02 — PROBLEM AWARE
Definition: Customer has a problem or need but has not specified a
solution. Needs diagnosis/direction.
Examples:
  "I need help with X"
  "I'm looking for something for Y"
  "What would you recommend for [situation]?"
Signals: Considering stage, open to guidance — Discovery Flow entry
point (Step 3 Module 2, to be defined).
Priority level (1E): 5

---

INTENT 03 — SOLUTION AWARE
Definition: Customer knows what they want and is ready to act.
Examples:
  "I want to book X"
  "I want to buy Y"
  "Can I get a table for 4 at 7pm"
Signals: Ready buying-readiness — Conversion Engine entry point if
active.
Priority level (1E): 4

---

INTENT 04 — EXISTING CUSTOMER — SUPPORT
Definition: Customer has a prior transaction and needs help related to
it.
Examples:
  "Where is my order?"
  "I need to reschedule"
  "Can you check on my booking?"
Signals: Existing Customer session state (1A) confirmed or implied;
requires Customer Memory lookup.
Priority level (1E): 3

---

INTENT 05 — COMPLAINT / NEGATIVE STATE
Definition: Customer is unhappy. Trust is broken or breaking.
Examples:
  "This is terrible"
  "I'm very disappointed"
  "This is the second time this has happened"
Signals: Universal Psychology Override Rule (Step 0A) applies — current
emotional state overrides archetype-default psychology.
Priority level (1E): 2

---

INTENT 06 — REFUND / CANCELLATION
Definition: Customer wants to undo a transaction.
Examples:
  "I want a refund"
  "Cancel my order"
  "I need to cancel my appointment"
Signals: May overlap with Intent 05 (often emotionally charged); always
requires Customer Memory to locate the transaction.
Priority level (1E): 3

---

INTENT 07 — HUMAN REQUEST
Definition: Customer explicitly wants a human, regardless of whether
the agent could resolve it.
Examples:
  "Let me speak to someone"
  "I want to talk to a person"
  "Can a real person help me"
Signals: Explicit override request — must be honored regardless of
agent confidence or freedom level (Step 2).
Priority level (1E): 3

---

INTENT 08 — COMPARISON / OBJECTION
Definition: Customer is evaluating, possibly testing the business
against alternatives.
Examples:
  "Why should I choose you?"
  "Competitor X is cheaper"
  "What makes you different?"
Signals: Deciding buying-readiness stage; Objection Handling Flow entry
point (Step 3 Module 2, to be defined).
Priority level (1E): 5

---

INTENT 09 — OFF-TOPIC / UNCLEAR
Definition: Message does not map to any business context recognizable
by the agent.
Examples:
  "lol ok"
  "what's the weather like"
  [a message with no discernible intent]
Signals: Low-value turn; agent must redirect, not ignore (Core Agent
Off-Topic Handler, Step 3 Module 1).
Priority level (1E): 7

---

INTENT 10 — RETURNING WITH CONTEXT
Definition: Customer references a prior conversation or interaction
explicitly.
Examples:
  "I was talking to someone earlier"
  "I got an email about..."
  "Following up on my last message"
Signals: Requires Customer Memory lookup regardless of session state
detected in 1A; if no matching memory is found, apply Step 0C Edge
Case ("Customer references a conversation the agent has no memory of")
— do not fabricate recall.
Priority level (1E): 3
```

---

### 1C.0 Runtime Configuration Resolver — Governing Principle

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
  active_modules        (Core always; Growth/Conversion/Recovery/Email
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

**Related:** For the client-facing process that determines these
configuration values at deployment time, see
`00_Project_Control/Client_Onboarding_Guide.md`.

---

### 1C. Configuration Load

After intent classification, the agent loads business configuration.

**What is loaded:**
```
- Industry / Archetype
- Modules active: Core / Growth / Conversion / Recovery / Email
- Archetype-specific capability flags
- Freedom level (agentic score, per Step 2)
- Escalation thresholds
```

**Language configuration:**
```
language_mode: fixed | adaptive
language_list: [array of supported languages, business-configured]

FIXED MODE:
  Agent uses exactly one language from language_list, regardless of what
  language the customer writes in. Which language is used is determined
  by language_list containing a single entry, or — if language_list has
  multiple entries but mode is fixed — the first/designated entry is
  used (business config specifies which one is primary in this case).

ADAPTIVE MODE:
  Agent detects the customer's language per message and matches it,
  but ONLY among the languages present in language_list. If the
  customer writes in a language not in language_list, the agent does
  not attempt to respond in that language — it falls back to the
  primary/default language in language_list and may note the
  limitation naturally, rather than guessing at an unsupported
  language.

  Code-mixed input (e.g., a customer mixing two configured languages
  in one message — "Banglish," Bangla-English mixing, or similar
  patterns in other language pairs) is matched by responding in the
  dominant/primary language the customer is using, maintaining a
  professional register. Full code-mixed generation (responding in
  the same mixed style back) is a harder implementation problem,
  platform-dependent (Voiceflow/Convocore NLU capability), and remains
  an open implementation detail — this section defines the
  configuration contract, not the detection algorithm.

DEFAULT (when a client does not specify language_mode):
  adaptive, bounded to whatever language_list is configured. If
  language_list itself is also unspecified, it defaults to a single
  entry matching the business's primary operating language (from
  Business Config), functioning identically to fixed mode with one
  language until the client configures additional languages.
```

**Example configurations:**
```
Single-language business (no multilingual need):
  language_mode: fixed
  language_list: ["English"]

Bangladesh-based business, adaptive within local languages:
  language_mode: adaptive
  language_list: ["Bangla", "English"]
  → Customer writes in Bangla → agent responds in Bangla
  → Customer writes in English → agent responds in English
  → Customer mixes both (Banglish) → agent responds in the dominant
    language of that message, professionally, per the code-mixed
    handling note above
  → Customer writes in Hindi (not in list) → agent falls back to
    the list's primary language, does not attempt Hindi

Multi-region business, broader adaptive list:
  language_mode: adaptive
  language_list: ["English", "Arabic", "Hindi", "Spanish"]
```

**What remains genuinely open (unchanged from before):** The precise
code-mixed-input *detection* mechanism (distinguishing which language
dominates a mixed-language message, and doing so reliably across
different language-pair patterns) is a platform/NLU-layer implementation
concern, not fully specified in this runtime document. This fix resolves
the *configuration contract* (mode + list + defaults) completely — the
detection algorithm itself is still a separate, platform-dependent task.

**Critical rule:** Configuration is loaded fresh at the start of every conversation. It is never cached from a prior session, and it is never assumed to still match what was loaded during a customer's previous interaction. This directly enforces the Step 0C Edge Case ("Business config has changed since customer's last visit") and the Step 0C Level 3 principle that Business Memory always reflects current state. A returning customer's session does not inherit yesterday's config — it reloads current config every time, even mid-session if the runtime supports live config updates.

**What happens if config is missing or incomplete:**
```
IF config fails to load entirely:
  → Agent falls back to Core Agent only (the always-on module, Step 3
    Module 1). No Growth, Conversion, Recovery, or Email behavior is
    assumed active.
  → Agent does not guess at archetype-specific behavior.
  → If the situation requires more than Core Agent can safely handle,
    agent escalates to human rather than improvising.

IF a specific required config flag is absent (e.g., freedom level not
set for this archetype):
  → Agent defaults to the most conservative behavior available for
    that flag (e.g., lowest freedom level, module treated as OFF).
  → Agent never defaults to the most permissive interpretation of a
    missing flag.
```

**Rule restated from Step 0 principles:** The agent never decides its own capability by inferring intent from context when config is silent. Missing config always resolves toward the safer, more restrictive fallback — never toward assumed permission.

---

### 1D. Module Routing

Route to the correct module based on intent (1B) + configuration (1C). Every decision below has an explicit YES branch and an explicit NO/fallback branch. No path ends without a defined next action.

```
MESSAGE CLASSIFIED (1B) + CONFIG LOADED (1C)
        ↓
IS THIS INTENT 05, 06, 07, OR AN EXISTING-CUSTOMER INTENT 04?
  YES → Route to Core Agent (Support/Complaint/Handoff sub-flow,
        Step 3 Module 1) — regardless of what other modules are
        active. Support/complaint/human-request always takes priority.
  NO  → continue
        ↓
IS INTENT 01 (INFORMATION SEEK) OR 02 (PROBLEM AWARE)?
  YES → IS REVENUE AGENT ACTIVE (per 1C config)?
          YES → Route to Growth Agent (Discovery/Recommendation,
                Step 3 Module 2)
          NO  → Route to Core Agent FAQ Handler only (Step 3 Module 1)
                — answer from KB, no discovery/recommendation attempted
  NO  → continue
        ↓
IS INTENT 03 (SOLUTION AWARE)?
  YES → IS CONVERSION ENGINE ACTIVE (per 1C config)?
          YES → Route to Conversion Engine (Step 3 Module 3, mode per
                archetype config)
          NO  → Agent responds: "I can share details, but bookings/
                purchases are handled by our team," then offers the
                best available fallback (link, handoff, or contact
                capture per Step 0B Tier 3) — never a dead end.
  NO  → continue
        ↓
IS INTENT 08 (COMPARISON / OBJECTION)?
  YES → IS REVENUE AGENT ACTIVE?
          YES → Route to Growth Agent Objection Handling Flow
                (Step 3 Module 2)
          NO  → Core Agent responds factually from KB (no persuasive
                objection handling without Growth Agent authority)
  NO  → continue
        ↓
IS INTENT 09 (OFF-TOPIC) OR 10 (RETURNING WITH CONTEXT)?
  YES → Route to Core Agent (Off-Topic Handler or Support/Context
        Recall Handler respectively, Step 3 Module 1)
  NO  → (should not occur — all 10 intents are covered above; if
        classification produced no match, treat as Intent 09
        Off-Topic and route accordingly rather than stalling)
        ↓
ESCALATION DETECTION runs in parallel at all times, independent of
which module the message was routed to. If an escalation trigger fires
(Step 3 Module 1 Human Handoff Handler criteria), it overrides the
module route in progress.
```

**Fallback rule restated:** Every disabled module has a defined graceful response somewhere in the tree above. No branch in this routing logic terminates without an explicit next action — either a module handoff or a stated fallback message.

---

### 1D.0.5 Module Responsibility Contract

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
MUST TRANSFER:   Discovery/recommendation → Growth Agent (if ON) or KB-only
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
                  handed off from Growth Agent
DOES NOT OWN:    Discovery, persuasion, objection handling — if an objection
                  surfaces mid-conversion, it re-routes, does not attempt to
                  resolve it itself
MUST TRANSFER:   Objection mid-conversion → Growth Agent (re-classify per
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
this is the direct fix for the FAQ/Growth cross-contamination pattern.

---

### 1D.1 Action Permission Check

Module access does not automatically grant every action inside that module. Two levels of permission exist: module-level and action-level.

```
Module permission: unlocks the room.
Action permission: unlocks the specific tool inside it.
```

Before executing any business action, the runtime checks:
```
1. Is the module enabled? (1D routing already confirmed this)
2. Is this specific capability enabled within that module?
3. Does the current context meet the authority level required?
```

**Example:**
```
Conversion Engine: ON
Cart Creation flag: OFF
Result: Agent may guide the customer toward purchase.
        Agent may NOT create a cart.
        Agent follows the configured fallback (Mode B: guided link).
```

**Example:**
```
Growth Agent: ON
Discount authority: NOT GRANTED
Result: Agent may explain value and handle objections.
        Agent may NOT offer or imply any discount.
        Agent escalates any discount request per Module 2 rules.
```

**Action-level permission examples by module:**
```
Commerce:      create cart / apply discount / modify order / process refund
Appointment:   view calendar / reserve slot / cancel booking / reschedule
Consultation:  qualify lead / quote pricing / book call / draft proposal
Emergency:     classify urgency / dispatch callback / access job queue
Email:         categorize / summarize / draft / auto-reply
```

**Rule:** When an action-level permission is absent, the agent does not attempt the action and does not imply it has the ability. It routes to the defined fallback silently — no explanation of internal permissions is given to the customer.

---

### 1D.2 Confidence Gate

Before generating a response or taking an action, the runtime checks confidence across four dimensions: intent understanding, customer identity, required data, and business information.

```
HIGH CONFIDENCE — Proceed normally.
  All four dimensions are clear. No ambiguity.
  Example: Customer: "Book the 3pm massage tomorrow."
           Calendar confirmed available. Identity confirmed.
           → Proceed directly to booking.

---

MEDIUM CONFIDENCE — Clarify before proceeding.
  One or more dimensions are unclear but not contradictory.
  Example: Customer: "I want the same thing as last time."
           Customer Memory exists but prior order is ambiguous.
           → Ask one targeted clarifying question before acting.
  Rule: Ask the minimum question that resolves the specific ambiguity.
        Do not re-run full discovery because one detail is unclear.

---

LOW CONFIDENCE — Do not proceed. Fallback.
  Too little information to act correctly. Acting would risk a wrong
  outcome.
  Fallback hierarchy:
    1. Ask the minimum clarifying question (if customer is still
       engaged)
    2. Fall back to Core Agent handling
    3. Escalate to human if the situation requires action the agent
       cannot safely take without clarity
  Rule: A wrong confident action is worse than a clarification request.

---

CONFLICTING — Resolve conflict before proceeding.
  Memory levels contain actively contradictory information about the
  same fact (per Step 0C Memory Conflict Resolution priority order).
  Example: Session Memory says customer wants Product A; Business
           Memory says Product A is discontinued.
  Resolution: Apply Step 0C priority order (Business Memory >
              Session > Customer History > Assumption).
  Do not average or blend conflicting sources. One source wins.
  Only after conflict is resolved does confidence re-evaluate as
  High/Medium/Low and proceed accordingly.
```

---

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

**Related:** For the naming standard every tool/webhook call follows
(verb-entity format, one action per tool), see
`06_Infrastructure/Tool_Naming_Convention.md`.

---

### 1E. Intent Switching & Priority System

Real customers do not follow linear flows. A customer can start in one intent and switch at any time, mid-conversation, without warning.

```
Example:
Customer: "What jacket do you recommend?"
→ Agent enters Commerce Growth Flow (Intent 02, Growth Agent active)

Customer: "Actually, my last order never arrived."
→ Agent must immediately switch to Support Mode (Intent 04).
```

**The intent recheck trigger:** Before generating every agent response — not just at conversation start — the runtime compares the previous classified intent against the current message's classified intent.

```
NEW CUSTOMER MESSAGE RECEIVED
↓
Classify current message intent (1B)
↓
Compare: Previous Intent vs Current Message Intent
↓
Did intent change?
  YES → Run Priority Check (below)
  NO  → Continue current flow uninterrupted
```

**Priority order (full table, 7 levels):**

| Priority | Category | Maps to Intent(s) |
|---|---|---|
| 1 | Safety / Emergency | Archetype-specific safety triggers (Step 4 Emergency); overrides all else regardless of intent classification |
| 2 | Complaint / Negative Experience | Intent 05 |
| 3 | Existing Customer Support | Intent 04, 06, 07, 10 |
| 4 | Ready Conversion | Intent 03 |
| 5 | Buying / Growth Conversation | Intent 02, 08 |
| 6 | General FAQ | Intent 01 |
| 7 | Off-topic | Intent 09 |

A higher-priority intent (lower number) always overrides a lower-priority one currently in progress. A lower-priority intent never interrupts a higher-priority one already active.

**Rules for switching — what is preserved, what resets:**
```
- Never continue selling when the customer switches into complaint
  mode — Priority 5 (or lower) work-in-progress is suspended, not
  discarded.
- Never restart qualification/discovery if the customer becomes ready
  to convert mid-discovery — jump forward to Priority 4 handling.
- Never ignore an urgent (Priority 1) request because a lower-priority
  flow was active — Priority 1 preempts immediately, no exceptions.
- Preserve previous context (Session Memory, per Step 0C Level 1) when
  switching — the suspended flow's state is not deleted, only paused,
  so the agent can resume it later if the customer returns to it
  ("earlier you mentioned the jacket — want me to pick that back up
  once this is sorted?").
- Resetting is reserved for information that is no longer valid after
  the switch (e.g., a half-completed Tier 2 data capture for the
  original flow is not silently carried into an unrelated new flow
  without re-confirming relevance).
```

**Worked example 1 — Commerce → Support:**
```
Customer: "Do you have this in a medium?"
  → Intent 03 (Solution Aware), Priority 4, Conversion Engine engaged.
Customer (next message): "Wait, actually my last order still hasn't
shown up."
  → Reclassified as Intent 04 (Existing Customer Support), Priority 3.
  → Priority 3 outranks Priority 4 → switch immediately to Core Agent
    Support Handler.
  → The medium-size inquiry is preserved in Session Memory, not
    discarded — agent may return to it after the order issue is
    addressed, if the customer wants to.
```

**Worked example 2 — FAQ → Complaint:**
```
Customer: "What are your hours?"
  → Intent 01 (Information Seek), Priority 6, Core Agent FAQ Handler.
Customer (next message): "Never mind, this whole experience has been
frustrating."
  → Reclassified as Intent 05 (Complaint), Priority 2.
  → Priority 2 outranks Priority 6 → immediate switch to Core Agent
    Complaint Handler (Step 3 Module 1), de-escalation sequence
    begins. The Universal Psychology Override Rule (Step 0A) applies:
    the customer is now in Complaint psychology, not FAQ psychology.
```

**Worked example 3 — Discovery → Ready-to-buy:**
```
Customer: "I need something for lower back pain relief."
  → Intent 02 (Problem Aware), Priority 5, Growth Agent Discovery
    Flow engaged (if active).
Customer (mid-discovery, 2 turns later): "Actually just send me the
link to the heating pad you mentioned, I'll take it."
  → Reclassified as Intent 03 (Solution Aware), Priority 4.
  → Priority 4 outranks Priority 5 → agent does not continue
    discovery questions. Immediately hands off to Conversion Engine
    (or fallback if OFF, per 1D) using the product already identified
    in Session Memory — no re-discovery, no redundant questions.
```

---

### 1F. Multi-Intent Handling System

Customers often express multiple needs in a single message. The agent must resolve all relevant intents without forcing the customer into a single path.

```
Example: "How much is this jacket, and can I get it before Friday?"

This contains:
  - Pricing question (Intent 01)
  - Delivery/timing question (Intent 01, adjacent)
  - Buying signal (Intent 03, implied)
```

**How agent detects multiple intents:** During classification (1B), the runtime checks whether the message contains more than one independently-answerable component — not just one topic phrased two ways. A single message can, and often does, map to more than one intent simultaneously.

**Blocking intent vs. supporting intent — how to tell the difference:**
```
BLOCKING INTENT: Information or resolution the customer needs before
they can or will proceed at all. Typically a concern, objection, or
missing fact that stands between the customer and the next step.

SUPPORTING INTENT: Information that adds to the interaction but does
not gate progress — the customer would still move forward even without
it answered immediately.

Test: "If this part of the message went unanswered, would the customer
still be willing to proceed?"
  NO  → Blocking
  YES → Supporting
```

**Resolution order:**
```
MESSAGE RECEIVED
↓
Detect all intents present (1B, applied per-component)
↓
Classify each as Blocking or Supporting
↓
Answer all Blocking intents first, fully
↓
Continue toward the business goal, weaving in Supporting intents
  where natural (does not require a separate turn if it fits
  naturally into the same response)
```

**Worked example 1:**
```
Customer: "Do you have this in medium and can I order?"
Detected: 1. Inventory question (Supporting — doesn't block ordering
             if answered as part of the same response)
          2. Purchase intent (primary — Intent 03)
Flow: Answer availability directly, then continue toward conversion
      in the same response ("Yes, we have it in medium — want me to
      get that started for you?").
```

**Worked example 2:**
```
Customer: "I want to book but what's your cancellation policy?"
Detected: 1. Booking intent (Intent 03)
          2. Policy concern (Blocking — customer has signaled this
             matters to their decision to proceed)
Flow: Answer the cancellation policy first, clearly, then continue
      toward booking — do not book first and mention policy after.
```

**Worked example 3:**
```
Customer: "I want to buy but your reviews look bad."
Detected: 1. Purchase intent (Intent 03)
          2. Trust objection (Blocking — Intent 08, an unresolved
             objection will undermine the purchase if ignored)
Flow: Handle the trust concern first (per Step 3 Module 2 Objection
      Handling Flow, value-focused, never defensive) → continue only
      after confidence is restored. Do not process the purchase while
      a live trust objection is unresolved.
```

**When multi-intent requires escalation:** If any detected component is itself Priority 1 or 2 on the Intent Switching table (1E) — a safety signal or a complaint — that component is not just "Blocking," it overrides the entire multi-intent resolution order and is handled per 1E's priority system first, before any other component in the same message is addressed. Multi-intent handling (1F) operates *within* a given priority level; it does not supersede the priority system in 1E.

---

### 1G. Conversation Exit Handling

Every conversation must end in a defined state. The runtime makes an explicit exit decision — conversations do not simply stop; they resolve to one of the following end states.

```
END STATE 1 — SUCCESSFUL COMPLETION
  Definition: Customer's stated goal was achieved in this conversation.
  Examples: purchase complete, booking confirmed, question fully
  answered.
  Action: Close naturally. No recovery record created.
          Update Conversion Lead Record or support log as appropriate.
```

**Archetype-conditional reinforcement (addition):** For archetypes with
higher Relationship-Transaction weighting (Step 0A) — Consultation,
Engagement, Appointment — a successful completion may include a brief,
genuine closing note beyond the bare transactional confirmation (e.g.,
warmth appropriate to the relationship, not a scripted add-on). Skip for
Commerce and Emergency, where Transaction weighting dominates (70-80%)
and a bare confirmation is the correct, friction-free close.

**Source:** Court, Elzinga, Mulder & Vetvik (2009), McKinsey Consumer
Decision Journey — post-purchase experience feeds the next consideration
cycle, not just a satisfaction score.

```
---

END STATE 2 — OPEN OPPORTUNITY
  Definition: Customer engaged meaningfully but did not complete a
              conversion. Intent was clear, value was exchanged, but
              the customer is not ready to commit yet.
  Examples: saved cart, recommendation sent, consultation summarized.
  Check:
    Recovery Engine active?
      YES → Create recovery record at the correct trigger moment
            (per Step 0B Section 4.1 System Lead Creation Rules and
            Step 3 Module 4 Recovery Trigger Definition).
      NO  → End politely. No record created beyond the Soft Lead.

---

END STATE 3 — UNRESOLVED ISSUE
  Definition: A support issue, complaint, or escalation was raised but
              not fully resolved before the conversation ended.
  Action: Escalation record created regardless of Recovery Engine
          status. Human follow-up flag set. Do not treat as a
          recovery opportunity until the underlying issue is resolved.

---

END STATE 4 — CUSTOMER DISENGAGED
  Definition: Customer stopped responding without a clear end signal.
  Check:
    Was meaningful intent detected before disengagement?
      YES (Intent 02/03/08 was active) → Evaluate Recovery Engine.
          Apply the correct recovery profile for the archetype.
      NO (only Intent 01, 09, or 10 was active) → End session
          silently. Anonymous Interaction Record only. No recovery
          attempt.

---

END STATE 5 — ESCALATED TO HUMAN
  Definition: Conversation was handed off to a human agent.
  Action: Per Step 3 Module 1 Human Takeover & Return Path rules.
          AI does not create a recovery record while human owns the
          conversation.
```

**Rule:** A conversation ending is a routing decision, not an absence of one.

---

### 1.H Global Active Issue Lock

The Global Active Issue Lock governs which actor owns contact with a specific customer at any point in time. Defined in full in Module 5 Section 2.9 — stated here at the runtime layer because it applies to all modules, not just Email Manager.

**Priority order (full definition in Module 5 Section 2.9):**
```
PRIORITY 1: Human agent with active ownership → all automated actors pause
PRIORITY 2: Active live conversation → Email Manager and Recovery pause
PRIORITY 3: Email Manager (active thread on same issue) → Recovery defers
PRIORITY 4: Recovery Engine → default automated owner
PRIORITY 5: Scheduled automation (transactional only)
```

This check is part of the External Event Entry Point (Section 1.0.1) and must be applied before any module acts on an externally-triggered event. For customer-message-initiated conversations, the live conversation itself holds Priority 2 automatically for its duration.

---

## STEP 1 COMPLETION SUMMARY

- **Sub-sections completed:** 1.0.1 / 1A / 1B / 1C.0 / 1C / 1D / 1D.0.5 / 1D.1 / 1D.2 / 1D.3 / 1E / 1F / 1G / 1.H
- **Decisions made:**
  - Assigned explicit Priority levels (1–7) to each of the 10 intents directly inside 1B, rather than only in 1E's table, so the two sections are self-consistent and a builder reading 1B alone still sees where each intent sits in the switching hierarchy.
  - Reinforced the Configuration First Principle (CLAUDE.md Rule 2) explicitly in 1C and 1D: every missing-config and disabled-module case resolves toward the most conservative/restrictive fallback, never toward assumed permission — this was treated as a hard constraint, not a stylistic preference.
  - In 1D's routing tree, Intent 06 (Refund/Cancellation) and Intent 07 (Human Request) were folded into the same top branch as Intent 04/05 (all route to Core Agent regardless of other active modules), since all four represent cases where support/trust concerns must outrank sales or conversion regardless of config — consistent with the Execution Plan's Module Routing example.
  - Treated 1E and 1F as operating at different layers rather than competing systems: 1E resolves *which* flow is active when intent changes entirely; 1F resolves *multiple simultaneous components* within a single message, and explicitly does not override 1E's priority system when a Priority 1/2 component is present.
  - Session state (1A) detection was tied explicitly to Customer Memory matching by contact method (per Step 0C 4.1 Shared Identity Handling), not by name, to keep this section consistent with the identity-handling rule already established.
- **Open questions:**
  - 1D's routing tree assumes Intent 08 (Comparison/Objection) always requires Growth Agent for a persuasive response — architect should confirm whether Core Agent alone should ever be allowed limited objection-handling (e.g., factual-only competitor comparisons) or whether this is correctly gated entirely behind Growth Agent as written.
    - **Answered:** Core Agent may provide factual-only competitor responses (pricing, features from KB). Persuasive objection handling (why we're better) requires Growth Agent. This boundary will be defined in Step 3 Module 1 and Module 2.
  - The "live config update mid-session" possibility mentioned in 1C (config reloading even within an active session, not just at conversation start) is stated as a capability the runtime should support, but the actual mechanism/trigger for a live reload is not yet specified — needs architect input on whether this is in scope for v1 or deferred.
    - **Answered:** Config reloads at conversation start and before any irreversible action (payment, booking, cancellation, refund). No per-message reload required for v1.
  - 1F's Blocking vs. Supporting test ("would the customer still proceed if unanswered") is necessarily judgment-based rather than a hard rule — Step 5 (Stress Test Library) should include specific borderline examples to pressure-test this distinction before builders implement it.
- **Additions applied:** Universal Runtime Loop (1.0) / Action Permission Check (1D.1) / Confidence Gate (1D.2) / Conversation Exit Handling (1G)
- **Mid-conversion objection (Intent 08 appearing during active Conversion Engine flow) flagged for Step 3 Module 3 — not resolved in Step 1 routing.**
- **Section 1.0.1 External Event Entry Point added** — defines EVENT RECEIVED as parallel runtime entry for external triggers.
- **Section 1.H Global Active Issue Lock added** — elevated from Module 5 to runtime layer for cross-module applicability.
- **Dormant Customer sub-state added to 1A.**
- **Batch 2 Phase 3 amendments applied (Part B):** 1G End State 1 (Successful Completion) now includes an Archetype-conditional reinforcement note (P2/B3, Court/Elzinga/Mulder/Vetvik 2009, McKinsey Consumer Decision Journey) — Consultation/Engagement/Appointment may include a brief genuine closing note beyond bare confirmation; Commerce/Emergency skip it, consistent with their Transaction-dominant weighting (Step 0A).
- **Batch 3 Round 1 (Enterprise Runtime Hardening) applied:**
  - **Section 1C.0 — Runtime Configuration Resolver — Governing Principle** (Patch 3), inserted immediately before 1C. Formalizes the already-implicit principle that the runtime contains every module/capability always, and config only activates/deactivates what exists — never a structurally different build per client. Does not alter any routing logic in 1C/1D/1D.1; documentation of existing behavior only.
  - **Section 1D.0.5 — Module Responsibility Contract** (Patch 4), inserted immediately after 1D and before 1D.1. The highest-priority item in Batch 3 Round 1 — directly fixes an observed production bug (FAQ Handler answering discovery questions it shouldn't; Growth Agent routing sales-adjacent questions back to FAQ instead of owning them). Defines OWNS/ALLOWED/DOES NOT OWN/MUST TRANSFER for all 5 modules, checked by each module before acting, independent of whether Step 1D's routing was correct.
  - **Section 1D.3 — Action Tool Execution Contract** (Patch 6), inserted immediately after 1D.2 and before 1E. Generalizes Module 3 §1.1 (Conversion State Machine) and §5 (Failure Handling)'s REQUESTED → WAITING → SUCCESS/FAILED/TIMEOUT lifecycle to every external tool call system-wide (Email Manager sends, Recovery Engine webhooks, future voice-platform calls), not just conversion actions. Module 3's own content was not modified — this section references and extends it.
- **Numbering note for architect review:** 1D.0.5 was chosen (per the instructions file's own suggested option) over integrating the Module Responsibility Contract as a lettered subsection of 1D, since 1D.1/1D.2/1D.3 are already established, cross-referenced section numbers throughout the document — inserting "1D.0.5" between 1D and 1D.1 adds the new content without renumbering anything downstream. 1C.0 and 1D.3 were placements explicitly specified in the instructions file, not judgment calls.
- **Batch 3 Round 4 (Data Architecture & Cleanup) applied:** 1C (Configuration Load) now includes a Language Configuration structural placeholder (Patch 10, Item 2) in "What is loaded" — `language_mode: fixed | adaptive` config structure only. Per explicit instruction, no default-mode decision or code-mixing detection algorithm was invented; both remain flagged as open items pending architect confirmation and future platform-layer NLU scoping.
  - **Pre-Step-4 update:** Language configuration is now fully specified as a complete configuration contract — `language_mode` (fixed | adaptive) paired with a companion `language_list` field (Adaptive-Bounded design: both modes share one list; fixed uses exactly one entry from it, adaptive matches the customer's language only among list entries, falling back to the primary entry for unsupported languages). Default when unspecified: adaptive, bounded to whatever `language_list` is configured, defaulting to a single entry (the business's primary operating language) if `language_list` itself is also unspecified. `language_list` added to Appendix A Business Config fields alongside `language_mode` (which had been missed in the original Round 4 placeholder). The one item that remains genuinely open, unchanged: the code-mixed-input (e.g., Banglish) *detection* mechanism — a platform-layer (Voiceflow/Convocore NLU) concern, not scoped in this document. This fix resolves the configuration contract completely; it does not resolve detection.
- **Pre-Step-4 rename applied throughout Step 1:** "Revenue Agent" → "Growth Agent" (Module 2's name only — module numbering, routing logic, and priority tables unchanged). Affects 1D's routing tree, 1D.0.5's Module Responsibility Contract, 1E's worked examples, and elsewhere Step 1 references Module 2 by name.
- **Ready for architect review:** YES

---

## STEP 2 — Freedom Boundary Specification

This section converts Agentic/SOP scores from abstract numbers into executable permission rules that any builder can implement, regardless of platform.

**Governing constraint for this entire step:** Freedom level controls behavior *inside* already-enabled capabilities. It never creates a new capability. Module permission and action-level permission (Step 1D.1) are decided entirely by configuration — freedom level has no vote in whether a capability exists. A freedom level 8/10 agent with Conversion Engine OFF still cannot book. A freedom level 2/10 agent with Conversion Engine ON still cannot go off-script to negotiate terms. These are two independent axes: **what the agent may do (config, Step 1C/1D/1D.1)** and **how the agent may behave while doing it (freedom level, this step)**.

### 1. The Core Problem

"Agentic 2/10" and "Agentic 8/10" are useful shorthand between architects, but they are not buildable specifications — a builder handed only a number has no way to know whether the agent should ask one question or three, whether it may push back on a customer's stated position, or whether it may recommend something the customer didn't ask about. Left to interpretation, the same score gets implemented inconsistently across platforms and even across playbooks on the same platform, which breaks the "configuration decides, agent executes" principle (CLAUDE.md Rule 2) at its foundation — if the number doesn't translate to identical behavior everywhere, the number isn't actually deciding anything. This step closes that gap by defining, for every score band, the exact operational limits: questions per turn, sequence flexibility, challenge authority, proactive recommendation rights, script deviation, off-script exploration, and decision-making authority — so "8/10" means the same thing whether it's read by a Voiceflow builder, a Convocore builder, or a future custom implementation.

### 2. Freedom Level Definition Table

| Score | Questions per turn (max) | Can reorder sequence? | Can challenge customer's position? | Proactive recommendation? | Can deviate from script? | Can explore off-script topics? | Decision-making authority |
|---|---|---|---|---|---|---|---|
| 1–2 | 1, fixed | No | No | No | No | No | None — executes fixed sequence only, routes/escalates on anything outside it |
| 3–4 | 1, fixed | No | No | Only if asked | Minor rephrase only | No | Minimal — may choose phrasing, not sequence or content |
| 5–6 | 1–2 | Yes | No | Yes | Yes, within topic | No | Moderate — may adapt question order and offer suggestions within the current topic |
| 7–8 | 1–2 | Yes | Yes | Yes, proactively | Yes | Yes, if relevant | Substantial — may diagnose, challenge, and guide the conversation shape, within business boundaries (Step 1D.1 action permissions) |
| 9–10 | Open | Yes | Yes | Yes | Full | Yes | Highest — full conversational latitude; still cannot grant itself an action-level permission it doesn't have |

**How discovery depth changes by band:**
```
1–2:  No discovery. Only triage-level classification needed to route
      (e.g., "is this an emergency, yes/no").
3–4:  Single-question discovery at most — enough to route to the right
      service/option, not enough to build a full picture of need.
5–6:  Multi-turn discovery within one topic — may ask a short follow-up
      chain, but stays inside the topic the customer raised.
7–8:  Adaptive discovery — each question is chosen based on the prior
      answer; may probe underlying need, not just surface request.
9–10: Open-ended discovery — may explore tangents if they serve
      understanding the customer's actual situation, may revisit
      earlier answers to refine understanding.
```

**How recommendations work by band:**
```
1–2:  No recommendations. Agent states facts/options only when asked
      directly; never suggests.
3–4:  Recommends only if the customer explicitly asks "what do you
      recommend" — never volunteered.
5–6:  May volunteer one recommendation once sufficient information is
      available, framed as a suggestion, easily declined.
7–8:  May proactively recommend before being asked, may recommend
      more than once if the customer's responses invite it, may
      suggest alternatives to a stated preference.
9–10: Full recommendation latitude, including recommending against
      what the customer initially asked for if agent has reason to
      believe it serves them better — always framed as guidance, never
      as a directive the customer must follow.
```

**How decision-making authority changes by band:**
```
1–2:  Agent makes no judgment calls. Every branch is pre-determined by
      the fixed sequence; ambiguity routes to escalation, not agent
      judgment.
3–4:  Agent may choose how to phrase a fixed response, not what the
      response contains.
5–6:  Agent may decide which of several pre-approved paths fits the
      customer's answer, and in what order to raise them.
7–8:  Agent may decide when to challenge, when to probe deeper, and
      when discovery is "enough" to move to the next stage — within
      business-authorized boundaries (still cannot quote price or make
      commitments the business hasn't authorized, per Step 1D.1).
9–10: Agent has the broadest interpretive latitude for *how* to reach
      the business goal, but the goal itself and every action-level
      permission remain fixed by configuration — freedom level never
      expands what the agent is authorized to do, only how skillfully
      it navigates getting there.
```

### 2.1 Default Freedom vs Configured Freedom

Archetype freedom scores are default recommendations, not permanent fixed values. The final freedom level for any deployment is determined during business configuration and may differ from the archetype default.

**Example:**
```
Default: Commerce Ecommerce = 3/10
Client requirement: Luxury personal shopping brand
Configured: 7/10
Result: Agent follows Commerce architecture but operates with
        advisory-level discovery and proactive recommendations.
```

**Example:**
```
Default: Consultation = 8/10
Client requirement: Strictly regulated industry (financial,
                    medical-adjacent)
Configured: 4/10
Result: Agent follows Consultation architecture but uses controlled,
        limited discovery — no proactive recommendations, fixed
        question sequence, all pricing/commitments gated.
```

**Rule:** Archetype defines the environment and available flows. Configuration defines the actual freedom level at runtime. Runtime executes the configured value — not the archetype default.

This means Step 2's worked examples show default behavior for each archetype. A client may configure a different band, and the agent will operate at that configured band using Step 2's rules for it — not the archetype's default band.

### 2.2 Risk-Based Freedom Reduction

Freedom level represents normal operation. Certain topics and situations temporarily reduce the agent's allowed behavior within a conversation turn. The runtime may reduce effective freedom. It may never increase it.

**Reduction triggers:**
```
- Legal questions or legal-adjacent claims
- Medical claims or health outcome assertions
- Financial commitments or investment-adjacent advice
- Safety concerns or product safety assertions
- Competitor or legal comparison claims
  (e.g., "our product is safer than Brand X for medical use")
- Complaint or negative-state context (per Universal Psychology
  Override Rule, Step 0A)
- Low Confidence or Conflicting confidence state (Step 1D.2)
- Uncertain information not confirmed in Business Memory (Step 0C L3)
```

**Example:**
```
Normal: Commerce Advisor configured at 7/10
Customer: "Will this supplement fix my condition?"
Temporary behavior: Reduce to 1–2 band style for this response only
Actions allowed: Provide only KB-confirmed product information.
                 No outcomes claimed. No comparisons.
                 Escalate if customer presses for a health claim.
```

The reduction applies only to the specific response that triggered it. Once the triggering element is resolved or handed off, the agent returns to its configured freedom level for subsequent turns.

**Rule:** Risk can restrict freedom within a turn. Risk cannot expand capability beyond what configuration permits. A risk reduction never creates a new action permission — it only narrows what the agent does with the ones it already has.

### 2.3 Discovery Budget Rule

The Freedom Level Table defines how many questions the agent may ask per turn, and how deeply it may explore. This rule defines when the agent *should stop*, regardless of how much it is *permitted* to do.

Permission to ask is not a requirement to ask.

**Before asking any discovery question, check:**
```
1. Is the answer to this question necessary for the next action?
2. Has the customer received value recently, or are they being asked
   to give without getting?
3. Is the customer showing readiness to proceed (per Step 1E intent
   switching — a buying signal overrides remaining discovery budget)?

If all three pass: ask.
If any fail: skip the question and move to the next appropriate step.
```

**Footnote — conversation length:** Weight check #2 ("has the customer
received value recently, or only given") more heavily as conversation
length increases. This is a soft precaution, not a hard rule — the
underlying research on decision fatigue is contested (magnitude disputed
in later replications) and does not justify a standalone detection
subsystem, only this lightweight adjustment to an existing check.

**Example:**
```
Consultation agent at 8/10 — permitted up to open-ended discovery.
Customer after question 3: "Can we just schedule a call?"
Runtime: Reclassify as Intent 03 (1E). Stop discovery.
         Move to conversion/handoff. Do not finish the planned
         discovery sequence because the freedom level permits it.
```

**Example:**
```
Commerce advisor at 7/10 — permitted proactive recommendations.
Customer gives a one-word answer ("blue") and stops responding
in depth.
Runtime: Customer Patience Window for Commerce is SHORT→MEDIUM
         (Step 0A). Reduce discovery immediately — one more
         confirming question maximum, then move toward conversion.
```

This rule connects Step 0A's Customer Patience Window to Step 2's discovery permissions: the Patience Window defines how long the customer will tolerate discovery; the Freedom Level defines how deeply the agent may go within that window. Both apply simultaneously.

### 3. What Each Level Looks Like in Practice

---

#### Emergency — Agentic 2/10

**Customer:** "My roof is leaking"

**Agent DOES:**
```
Agent: "That sounds urgent — is water actively coming into your home
right now, or is it a slower leak?"
Customer: "Actively coming in."
Agent: "Understood. Can I get your address and a number to reach you
at? I'll get someone dispatched right away."
```
Internal thinking: *Classify severity → collect location → collect phone → route. Fixed sequence, two branches only (emergency path / non-emergency path). No detour.*

**Agent REFUSES:**
```
Customer: "Should I go with a metal roof or shingles for the repair?"
Agent: "That's a great question for the technician once they assess
the damage — right now let's get someone out to you. Can I get your
address?"
```
Internal thinking: *This is a material/education question — level 2/10 does not explore, educate, or compare options. Redirect to the fixed sequence immediately, do not engage the tangent even briefly.*

---

#### Commerce (Ecommerce) — Agentic 3/10

**Customer:** "Do you have this jacket in medium, and is it worth it over the cheaper one?"

**Agent DOES:**
```
Agent: "Yes, it's available in medium. Since you asked — the main
difference from the cheaper option is the waterproof shell; if you're
using it somewhere wet or windy, that's the deciding factor."
```
Internal thinking: *Customer explicitly asked "worth it" — this is Level 3/4's "recommend only if explicitly asked" exception. Answer directly, do not volunteer beyond what was asked.*

**Agent REFUSES:**
```
Customer: "Just pick whichever one you think is best for me overall."
Agent: "Both are great picks — the difference really comes down to
whether you need the waterproofing. Which matters more for how you'll
use it?"
```
Internal thinking: *Level 3/4 cannot make an open-ended judgment call on the customer's behalf (that requires 9–10 decision authority) — reflect the decision back with the one clarifying factor rather than choosing for them.*

---

#### Commerce (Restaurant) — Agentic 2/10

**Customer:** "Table for 4 tonight at 8, and can you seat us somewhere quiet, we're celebrating."

**Agent DOES:**
```
Agent: "I can get you a table for 4 at 8pm tonight. I'll note the
celebration and request a quieter table — I can't guarantee exact
placement, but I'll pass that along."
```
Internal thinking: *Fixed sequence: confirm party size/time → note special request → confirm. No negotiation beyond passing along the request.*

**Agent REFUSES:**
```
Customer: "Can you also put together a custom tasting menu for us?"
Agent: "I'm not able to arrange a custom menu, but I can pass your
celebration along to the team — would you like me to also connect you
with someone who can help with that?"
```
Internal thinking: *Level 2/10 has zero deviation-from-script authority — a custom menu request is off the fixed reservation sequence entirely; route to human rather than attempt to accommodate.*

---

#### Appointment — Agentic 4/10

**Customer:** "I want a massage"

**Agent DOES:**
```
Agent: "Happy to get that booked — do you know which type you're
after (deep tissue, swedish, etc.), or would you like a quick
recommendation based on what you're looking for?"
```
Internal thinking: *One guiding question, minor rephrase allowed based on customer's answer, proactive suggestion only if asked — matches the 3–4 band's "recommend only if asked" rule even though this archetype sits at 4/10.*

**Agent REFUSES:**
```
Customer: "I'm not sure, what would you personally suggest for
someone stressed and also wants to work on an old shoulder injury?"
Agent: "For a shoulder concern I'd point you toward our therapeutic
massage rather than deep tissue, since deep tissue can be intense on
an existing injury — want me to book that, or would you like more
detail first?"
```
This *is* allowed at 4/10 because the customer explicitly asked what the agent would suggest — this is the "proactive recommendation only if asked" exception firing correctly, not a refusal case. A true refusal at this level would be:
```
Customer: "Can you just design a whole custom wellness plan for me
across multiple visits?"
Agent: "I can get you booked for today's session — for a multi-visit
plan, I'll have one of our specialists reach out to put that
together."
```
Internal thinking: *Multi-session program design is open-ended planning beyond a single-topic, single-booking scope — outside 4/10's "within topic" deviation limit.*

---

#### Engagement — Agentic 4/10

**Customer:** "What does your organization actually do with donations?"

**Agent DOES:**
```
Agent: "Great question — about 85% of donations go directly to
[specific program], the rest covers essential operations to keep that
running. Is there a particular area you're most interested in?"
```
Internal thinking: *Single, direct, specific answer plus one follow-up question to understand their interest — matches 3–4/5–6 blended discovery depth appropriate to this archetype's Long Patience Window (Step 0A) even at a modest freedom score.*

**Agent REFUSES:**
```
Customer: "Convince me why I should donate instead of to another
charity I'm considering."
Agent: "I won't try to argue against another cause you're considering
— I can tell you specifically what your donation would do here, and
you can decide what feels right."
```
Internal thinking: *Level 4/10 cannot challenge the customer's position (per the table: "Can challenge customer's position? No" through band 5–6) — comparative persuasion against a competitor is a challenge-authority action reserved for 7/10+, and even then Step 0A's Engagement psychology forbids competitor attacks regardless of freedom level.*

---

#### Consultation — Agentic 8/10

**Customer:** "I need more clients for my business."

**Agent DOES:**
```
Agent: "When you say 'more clients' — is the bottleneck more leads
coming in, or leads coming in but not converting? Those are pretty
different problems."
```
Internal thinking: *Proactive, adaptive discovery — challenges the vagueness of "more clients" respectfully, chooses the next question based on this being the first substantive answer. This is 7–8 band behavior: proactive recommendation/challenge authority, adaptive sequence.*

**Agent REFUSES:**
```
Customer: "Just tell me the price and I'll decide if I want to move
forward."
Agent: "I hear you — I don't have pricing authority to quote directly,
that's something our team finalizes based on your specific situation.
What I can do is make sure they have full context so that conversation
is quick once you connect."
```
Internal thinking: *This is not a freedom-level restriction — it's an action-level permission boundary (Step 1D.1): "quote pricing" is not a granted Consultation action regardless of freedom score. Even 9–10 could not do this if the action permission isn't granted — the refusal is about capability, not conversational latitude.*

### 4. Freedom Boundary Enforcement Rules

Universal rules that apply regardless of freedom score:

```
WHAT NO AGENT MAY DO, REGARDLESS OF FREEDOM LEVEL:
- Grant itself an action-level permission that configuration has not
  enabled (Step 1D.1) — freedom level never overrides a permission gate.
- Quote a price, discount, or commitment the business has not
  explicitly authorized it to make.
- Continue a sales/discovery flow when a higher-priority intent
  (Safety, Complaint, Existing-Customer Support — Step 1E priority
  1–3) is active.
- Fabricate information not present in Business Memory (Step 0C Level
  3) regardless of how much conversational latitude its score allows.
- Violate any Universal Prohibition from Step 0B (data collection) or
  Privacy Boundary from Step 0C, at any freedom level.

WHAT REQUIRES HUMAN TAKEOVER, REGARDLESS OF FREEDOM LEVEL:
- Any explicit human request (Intent 07) — freedom level does not
  grant authority to talk a customer out of escalating.
- Any action-level permission gap where the customer's need cannot be
  met by any available fallback.
- Any Priority 1 (Safety/Emergency) situation exceeding what the
  archetype's fixed escalation path defines.

WHAT THE AGENT MUST ALWAYS DO, REGARDLESS OF FREEDOM LEVEL:
- Operate within the Customer Patience Window and Relationship/
  Transaction Weight defined for the archetype (Step 0A) — freedom
  level shapes *how* the agent behaves, not whether it respects the
  customer's psychology.
- Apply the Confidence Gate (Step 1D.2) before acting — a high freedom
  score does not permit acting on Low Confidence or unresolved
  Conflicting information.
- Preserve context across intent switches per Step 1E, regardless of
  how much sequence flexibility its score grants.
```

### Runtime Learning Boundary

The agent adapts its conversational style. It does not modify its operating scope.

**Style adaptation — ALLOWED:**
```
Customer prefers shorter answers → agent responds more concisely.
Customer uses informal language → agent can match tone within
professional bounds.
Customer explicitly states a preference → agent honors it for the
remainder of the session (Session Memory, Step 0C Level 1).
```

**Scope modification — NOT ALLOWED:**
```
Customer repeatedly asks for discounts → agent does not develop a
discount policy or treat the repetition as implicit authorization.
Customer states a new preference that contradicts business rules →
agent follows Business Memory (Step 0C Level 3 priority), not the
customer's stated preference.
Customer provides a high-quality answer that makes the agent "feel"
qualified to make a broader commitment → agent stays within its
action-level permissions (Step 1D.1) regardless of conversational
quality.
```

**The boundary:** agents adapt style, never scope.
```
Style = response length, tone, phrasing, question order within the
        permitted band, level of formality.
Scope = rules, action permissions, business policies, escalation
        thresholds, data collection doctrine.
```

No customer interaction, no matter how persuasive, grants the agent authority to modify its own scope. Scope is owned by configuration.

### 5. Edge Cases

```
EDGE CASE: Customer pushes agent to act beyond its freedom level
  Example: Emergency (2/10) customer insists agent compare repair
  options in depth.
  Handling: Acknowledge the request without engaging it at the
  disallowed depth, redirect to the fixed sequence. Do not apologize
  for a limitation in a way that undermines confidence (per Step 0A
  Emergency "what creates confidence") — redirect confidently, not
  apologetically.

EDGE CASE: Customer asks agent to "just decide for me" (high SOP,
low freedom agent)
  Example: Commerce Ecom (3/10) customer says "you pick."
  Handling: Reflect the decision back with the single deciding factor
  (see Ecom worked example above) rather than either refusing flatly
  or overstepping into a 9–10-level judgment call the score doesn't
  authorize.

EDGE CASE: Customer asks for creative/open-ended input (low agentic
agent)
  Example: Appointment (4/10) customer asks for a "whole custom
  wellness journey."
  Handling: Fulfill the in-scope portion (book today's session) and
  route the open-ended portion to a human or specialist — do not
  attempt to improvise scope the freedom level doesn't cover.

EDGE CASE: Agent is mid-discovery when customer becomes ready to buy
(Consultation)
  Example: Consultation (8/10) agent is two questions into adaptive
  discovery when customer says "just book me in."
  Handling: This is governed by Step 1E (Intent Switching) — Intent 03
  (Solution Aware, Priority 4) outranks Intent 02 (Problem Aware,
  Priority 5) mid-discovery. Freedom level does not override intent
  priority: even at 8/10, the agent stops discovery and moves to
  conversion handoff rather than "finishing the question it was on"
  because a high score permits adaptive questioning. High freedom
  level governs *how well* the agent discovers, not *whether* it must
  respect the customer's readiness signal.
```

---

## STEP 2 COMPLETION SUMMARY

- **Decisions made:**
  - Framed the entire step around one governing constraint — freedom level operates strictly inside already-permitted capability (Step 1D.1), never expanding it — and repeated this distinction explicitly in the Consultation worked example (price-quoting refusal) so builders don't conflate "high freedom score" with "more capabilities."
  - Added a "Decision-making authority" column to the Freedom Level Definition Table beyond what the Execution Plan's original table specified, plus separate prose blocks for discovery depth, recommendation mechanics, and decision authority per band — this was necessary to satisfy the requirement that each freedom level define these three dimensions explicitly rather than leaving them implied by the table alone.
  - For Engagement (4/10), used a DOES example that is itself an answer-plus-light-discovery rather than a single fact, since Step 0A defined Engagement's Patience Window as Long/High-discovery-tolerance even though its freedom score (4/10) is only moderate — the worked example reflects both constraints simultaneously (moderate freedom, but archetype psychology tolerates more depth than the score alone might suggest) to avoid the two frameworks (freedom level vs. archetype psychology) reading as contradictory.
  - For Appointment (4/10), included both an "allowed" proactive-recommendation example and a true refusal example, since the initial draft's first REFUSES case was actually a correctly-allowed exception (recommend-if-asked) — this was corrected in place rather than left ambiguous, to keep the DOES/REFUSES distinction accurate rather than just structurally present.
- **Open questions:**
  - The Freedom Level Definition Table currently defines behavior in bands of 2 (1–2, 3–4, 5–6, 7–8, 9–10), matching the Execution Plan's original table — but individual archetypes are assigned odd-adjacent scores that sometimes span a described nuance (e.g., Appointment/Engagement both at 4/10 but with different psychology profiles from Step 0A) — architect should confirm whether band-level rules are sufficient or whether specific scores need individual carve-outs beyond their band.
    - **Resolved:** Score bands are sufficient. Individual score precision is not required — archetype-specific behavior comes from band + customer psychology + configuration combined.
  - Enforcement Rules Section 4 states freedom level "never overrides intent priority" (Step 1E) — this is consistent with Step 1 as written, but Step 4 (Archetype Operating Systems) should explicitly re-verify this holds for Consultation specifically, since 8/10's adaptive discovery is the archetype most likely to create pressure to "just finish the question."
  - No archetype in Step 0 or Step 1 is currently scored at 1/10 or 9–10 — the table defines those bands for completeness, but it's an open question whether any future archetype/config will actually use the extremes, or whether they exist only as theoretical bounds.
    - **Resolved:** 1/10 and 9–10 bands are retained as valid future-use boundaries, not theoretical-only. Confirmed by architect.
- **Additions applied:** Default Freedom vs Configured Freedom (2.1) / Risk-Based Freedom Reduction (2.2) / Discovery Budget Rule (2.3) / Runtime Learning Boundary (Section 4)
- **Batch 2 Phase 3 amendments applied (Part B):** Section 2.3 (Discovery Budget Rule) now includes a conversation-length footnote (P2/B2) — weight check #2 more heavily as conversation length increases. Explicitly a soft precaution, not a new subsystem, since the underlying decision-fatigue research is contested.
- **Ready for architect review:** YES

---

## STEP 3 — Service Module Flows

### MODULE 1 — Core Agent (Always Active)

This module is the minimum viable agent. It exists in every deployment regardless of what other modules are purchased or active. Every other module in Step 3 assumes Core Agent is present; Core Agent assumes nothing about any other module.

#### 1. Purpose & Scope

**What this module does:** Answers questions from the business knowledge base, recognizes and serves existing customers, de-escalates and resolves complaints, hands off to a human when needed, and keeps off-topic messages from derailing the conversation. It is the floor every deployment stands on — per Step 1D, Core Agent is the destination for Intent 04 (Existing Customer Support), 05 (Complaint), 06 (Refund/Cancellation), 07 (Human Request), 09 (Off-Topic), and 10 (Returning With Context) regardless of which other modules are active, and it is the fallback destination for Intent 01/02 when Growth Agent is OFF (Step 1D routing tree).

**What this module does not do:** It does not generate proactive recommendations, run discovery/qualification flows, create carts, process bookings, apply discounts, or take any action gated behind an action-level permission it doesn't hold (Step 1D.1). Those behaviors belong to Modules 2–5 and only activate if configuration turns them on. Core Agent's freedom level for its own behaviors (phrasing, redirect style) still follows Step 2 — but Core Agent itself is not a sales or conversion mechanism.

---

#### 2. Sub-Flows

---

##### A. FAQ Handler

**Entry condition:** Intent 01 (Information Seek) is classified and either no other module is active, or the specific question is answerable directly from Business Memory without requiring discovery (Step 1D: "NO Growth Agent → Core FAQ Handler only").

**KB search logic:**
```
1. Extract the specific question(s) from the message (per Step 1F if
   multiple components are present).
2. Query Business Memory (Step 0C Level 3) — KB, policies, pricing
   rules, availability — for a direct match.
3. Apply the Confidence Gate (Step 1D.2) to the match quality before
   responding.
```

**Confidence threshold (found vs. not found):**
```
HIGH CONFIDENCE  → Treated as "found." Answer directly, no hedging.
MEDIUM CONFIDENCE → Treated as "partially found." Answer what is
                    confirmed, ask one clarifying question to resolve
                    the rest (per Step 1D.2 Medium Confidence rule —
                    minimum question, no full re-discovery).
LOW CONFIDENCE or CONFLICTING → Treated as "not found." Do not guess.
                    Move to clarification-attempt sequence below.
```

**Clarification attempts before escalating:** Maximum of 2 clarification attempts. If the question remains unanswerable from Business Memory after 2 attempts, escalate via the Human Handoff Handler (below) rather than continuing to guess or re-ask indefinitely — this also respects the archetype's Customer Patience Window (Step 0A), which sets an outer bound tighter than 2 attempts for Emergency (Very Low tolerance — see Edge Cases).

**What agent says when it doesn't know:**
```
"I don't have a confirmed answer for that — rather than guess, let me
connect you with someone who can get you the right information."
```
Never fabricates an answer to avoid saying "I don't know" (Step 0C Level 3: agent must never override current business data with assumptions).

**Standing correction invitation:** Every FAQ answer delivered at High or
resolved Medium confidence includes an implicit or explicit opening for
correction, rather than being presented as a closed, final statement.

Example phrasing pattern: "...does that answer what you needed, or is
there something more specific I should address?" — not required verbatim,
but the answer should never read as a flat, uncorrectable pronouncement.

**Source:** Dietvorst, Simmons & Massey (2018) — overcoming algorithm
aversion via user control/adjustment.

**Reasoning requirement:** When the agent cannot answer, states a failure,
or escalates, it briefly includes the reasoning rather than a bare outcome
statement. This extends the same pattern already used in Module 2's
Recommendation Flow ("tie recommendation to what customer said") to the
failure/unknown case.

Example: "I don't have a confirmed answer for [specific topic] in what
I have access to — rather than guess, let me connect you with someone who
can get you the right information." (The bracketed reasoning clause is the
addition — previously this was a generic non-specific statement.)

**Source:** Journal of Business Research, Vol. 180 (2024) — explainable-AI
post-hoc explanations softening negative reactions to failures.

**Exit conditions:** Question answered at High or resolved Medium confidence (return to idle/await next message) → OR escalated to Human Handoff Handler after 2 failed clarification attempts → OR intent changes mid-flow (Step 1E recheck triggers before every response, may redirect to a different handler entirely).

---

##### B. Support Handler (Existing Customer)

**Entry condition:** Intent 04 (Existing Customer Support) is classified, or session state (Step 1A) is "Existing Customer" and the message concerns a prior transaction.

**How agent detects existing customer status:** Customer Memory (Step 0C Level 2) match by contact method to a Lead Record with Lead Status "Converted," or a linked Conversion Record — per Step 1A's Existing Customer definition. Never matched by name alone (Step 0C Section 4.1 Shared Identity Handling).

**Priority rule — resolve before selling:** Per Step 1A and Step 1D, an active support issue always outranks sales/discovery. If Growth Agent or Conversion Engine would otherwise engage on this message, Support Handler takes the conversation first and those modules stand down until the issue is resolved or explicitly deferred by the customer.

**Data it reads from customer record:** Transaction history, prior service/product (per Step 0C Level 2), current Business Memory status of that transaction (booking status, order status) per Step 0C Level 3 priority (current business data overrides stale customer history — e.g., Step 0C's discontinued-product example).

##### Customer Verification Rule

Recognizing a customer from Customer Memory is not the same as verifying them for sensitive actions. These are two separate checks.

```
ZERO-VERIFICATION ACTIONS (no check required):
  Information available from Session Memory in this conversation.
  Example: "What time is my appointment?" — booked this session,
           already in Session Memory. No verification step needed.

LOW-RISK ACTIONS (light verification acceptable):
  General status lookups, policy questions, publicly available info.
  Example: "What's my order status?" — confirm one known identifier
           (order number or email) before surfacing order details.

HIGH-RISK ACTIONS (configured verification required before action):
  Any modification of account data, order details, payment info,
  or cancellation of a service.
  Examples: change shipping address, cancel booking, modify
            personal data, payment dispute.
  Handling: Do not execute until the configured verification process
            is completed. If no verification process is configured,
            route to Human Handoff Handler — do not attempt to
            improvise a verification approach.
```

**Rule:** Knowing the customer and verifying the customer are different things. Customer Memory enables recognition. Verification enables action authority.

**Exit conditions:** Issue resolved within Core Agent's authority (status lookup, reschedule within policy, information provided) → close per Step 1G End State 1 (Successful Completion) → OR issue requires action beyond Core Agent's action-level permissions (Step 1D.1) → route to Human Handoff Handler → OR issue reveals a complaint/negative state mid-conversation → re-classify and hand to Complaint Handler (Step 1E intent recheck).

---

##### B.1 Support → Opportunity Detection

Core Agent does not sell. However, it recognizes when a customer naturally opens a new opportunity after their support need is resolved.

**Trigger conditions (ALL must be true):**
```
1. The support or complaint issue is fully resolved (Step 1G End
   State 1 reached for that issue).
2. The customer introduces a new, separate need unprompted.
3. The new need is distinct from the resolved support matter.
```

**Example:**
```
Customer: "Thanks, that fixed it. Do you also offer monthly plans?"
Runtime: Check — Growth Agent active?
  YES → Hand off to Growth Agent (Module 2) with the new intent.
  NO  → Answer factually from KB only. No discovery, no push.
```

**What Core Agent NEVER does:**
```
Creates the sales moment itself.
Wrong: "Glad we sorted that! By the way, have you seen our new range?"
The customer must open the door. Core Agent does not open it for them.
```

**Rule:** Support earns trust. Growth handles growth. Core Agent bridges them only when the customer crosses first.

---

##### C. Complaint Handler

**Entry condition:** Intent 05 (Complaint/Negative State) classified. Per the Universal Psychology Override Rule (Step 0A), the customer is now in Complaint psychology regardless of archetype default — this overrides whatever flow was previously active.

**De-escalation sequence:**
```
1. Acknowledge the complaint directly and specifically — never with a
   generic apology that ignores what was said.

   Specific:   "You're right that your order should have arrived by
               Tuesday — I can see it's still showing in transit.
               That's not acceptable and I want to make sure we fix
               it."
   Generic:    "I'm so sorry for any inconvenience. We'll look into
               it."
   The difference: specific names the problem, confirms the
   customer's expectation was correct, and commits to a direction —
   generic acknowledges nothing and commits to nothing.

2. Do not sell, upsell, or mention any offer during this sequence.
3. Diagnose what actually went wrong using Customer Memory (Level 2)
   and current Business Memory (Level 3) status — not assumption.
4. Offer the resolution within Core Agent's action-level permissions.
5. Confirm the customer is satisfied with the proposed resolution
   before closing.
```

**What agent can offer vs. cannot offer:** Can offer: acknowledgment, status information, corrections within documented policy (e.g., a policy-defined reschedule), escalation. Cannot offer: discounts, refunds, or any commitment requiring an action-level permission Core Agent doesn't hold (Step 1D.1) — those route to Human Handoff or, if Conversion/Recovery modules are active and the specific action is permitted there, a defined inter-module handoff (not a Core Agent improvisation).

**Proportionality note (addition):** Offered resolution should match the
severity of the issue as understood from the diagnosis step — do not
over-correct minor issues or under-correct significant ones, within held
action-level permissions (Step 1D.1).

**When complaint triggers immediate escalation vs. agent handles:**
```
AGENT HANDLES:
  Complaint is specific, within Core Agent's action-level permissions
  to resolve (e.g., status confusion, a documented policy question),
  and the customer accepts the proposed resolution.

IMMEDIATE ESCALATION:
  - Complaint involves a refund/legal/safety dimension.
  - Customer explicitly requests a human (Intent 07 — always honored
    regardless of freedom level, per Step 2 Section 4).
  - Two resolution attempts have not satisfied the customer.
  - Confidence Gate (Step 1D.2) is Low or Conflicting regarding what
    actually happened — agent must not guess at a resolution.
```

**Recovery opportunity check (only after resolution):** Per Step 0B's non-trigger conditions and Step 1G End State 3, a recovery record is never created while a complaint is open. Only after the complaint reaches Successful Completion (Step 1G End State 1) does the runtime evaluate — separately — whether an unrelated recovery opportunity exists (e.g., a different, still-open sales interest from earlier in the conversation, preserved per Step 1E context-preservation rules).

**Exit conditions:** Resolved and confirmed satisfactory (Step 1G End State 1) → OR escalated to Human Handoff Handler (Step 1G End State 3, Escalation record created regardless of Recovery Engine status) → OR customer disengages mid-complaint (Step 1G End State 4, evaluated per that state's disengagement rules — a complaint context is never treated as a silent, no-recovery-needed exit).

---

##### D. Human Handoff Handler

**Entry condition:**
```
EXPLICIT REQUEST: Intent 07 (Human Request) classified — always
  honored immediately, regardless of freedom level (Step 2 Section 4)
  or how close the agent believes it is to resolving the issue itself.

AGENT-TRIGGERED: FAQ Handler exhausts 2 clarification attempts (A) /
  Complaint Handler reaches an immediate-escalation condition (C) /
  Confidence Gate (Step 1D.2) returns Low Confidence on a matter
  requiring action / any action-level permission gap with no
  available fallback (Step 1D.1 / Step 2 Section 4).
```

**Underlying rationale (clarification, not new behavior):** The existing
escalation triggers (Low/Conflicting confidence, action-permission gaps)
are functionally task-complexity signals — research confirms complexity,
not channel or demographic preference, is what should drive human-handoff
decisions. This note names the existing behavior's rationale explicitly;
it does not change any trigger condition.

**Source:** Journal of Retailing and Consumer Services (2020).

**What agent says during handoff:**
```
"I'm connecting you with someone on our team who can help further —
I'll make sure they have the full context so you don't have to repeat
yourself."
```
Never says this in a way that implies failure or apologizes excessively (undermines confidence per Step 0A archetype-specific "what creates confidence" guidance, especially Emergency).

**What context is passed to human agent:** Full conversation_summary (per Integration Contract field), classified intent history, any Customer Memory referenced, and the specific reason for escalation (which handler/condition triggered it) — so the human is not starting cold.

##### Escalation Priority Classification

Not every human handoff has equal urgency. The agent assigns a priority level at the time of escalation so the human team can respond in the correct order.

The agent also includes the following conceptual fields in escalation context (planned for Integration Contract v2: `escalation_type`, `escalation_reason`, `escalation_priority`, `origin_module`, `trigger_condition`):

```
PRIORITY 1 — IMMEDIATE
  Examples: active safety concern, severe complaint or trust failure,
            urgent operational failure (order not delivered and time-
            sensitive), customer in distress.
  Expected response: Immediate human pickup.

PRIORITY 2 — STANDARD
  Examples: action-level permission gap, account modification
            request, refund/cancellation requiring authorization,
            unclear issue after 2 clarification attempts.
  Expected response: Standard queue response time.

PRIORITY 3 — REVIEW
  Examples: improvement feedback, uncommon question not in KB,
            low-urgency follow-up, information request the agent
            could not confirm.
  Expected response: Async review, no immediate response needed.
```

**Note:** Priority 1 escalations are also logged as Priority 1 in the Escalation record (Integration Contract: Escalation Status = "Open" with priority field — confirm field name in Integration Contract v2).

**Human Takeover & Return Path:**
```
CASE 1 — Issue fully resolved by human
  Future normal questions → Return to AI. Standard Step 1A session
  state resumes (Existing Customer or Returning Lead as applicable).

CASE 2 — Sensitive ongoing issue
  Examples: refund dispute, legal issue, high-value negotiation.
  Human remains owner. AI does not resume this specific thread even
  if the customer returns and asks about it — routes back to the
  human/queue.

CASE 3 — Customer returns with unrelated request
  Example: Previous — refund issue (human-owned). Later — new product
  question.
  Return to AI. The unrelated new request is evaluated fresh per
  normal Step 1 routing; it is not blocked by the still-open human
  case.
```

**AI resume behavior after human handoff ends:** When AI resumes after a human interaction, it acknowledges context briefly ("picking up from where things left off") and does not pretend it personally handled the human's portion of the conversation — consistent with Step 0C's honesty-about-memory-source principle.

**Exit conditions:** Handoff message delivered and conversation ownership transferred (Step 1G End State 5, Escalated to Human) → AI does not create a recovery record while human owns the conversation (Step 1G End State 5 rule) → conversation later resumes AI ownership per Case 1 or Case 3 above, re-entering the Universal Runtime Loop (Step 1.0) fresh.

---

##### E. Off-Topic Handler

**Entry condition:** Intent 09 (Off-Topic/Unclear) classified — message does not map to any recognizable business context.

**What agent does:** Redirects, never ignores. Acknowledges the message was received, briefly and without judgment, then guides back toward what the business can help with.
```
Example: "That's outside what I can help with here — is there
something about [business/service] I can help you with?"
```

**How many redirects before ending conversation:** Maximum of 2 redirect attempts. If a third consecutive message is still off-topic, the agent ends the conversation politely rather than looping indefinitely.
```
"I'll leave this here for now — feel free to reach out anytime you
have a [business]-related question."
```

##### Off-Topic Counter Reset Rule

The off-topic counter tracks consecutive off-topic messages, not lifetime off-topic count for the conversation.

**Rule:** If the customer returns to a valid business topic between off-topic messages, the counter resets to zero.

```
Example:
Message 1: Off-topic → Counter = 1
Message 2: Off-topic → Counter = 2
Message 3: "Actually, I need help booking." → Counter resets to 0.
→ Route normally per Step 1B classification.
Message later: Off-topic → Counter = 1 (fresh count, new sequence).
```

**Reason:** Do not penalize long conversations for earlier unrelated messages. Each off-topic sequence is evaluated independently.

**Exit conditions:** Customer returns to an on-topic intent within 2 redirects (re-classify per Step 1B, route normally) → OR 2 redirects exhausted with no on-topic return → close per Step 1G End State 4 (Customer Disengaged, No meaningful intent detected branch — Anonymous Interaction Record only, no recovery attempt).

---

#### 3. Fallback Behavior

Core Agent has no fallback — it is always ON regardless of configuration; there is no "Core Agent OFF" state for the runtime to fall back from.

**What happens when KB is completely empty (Business Memory Level 3 has no content to search):**
```
FAQ Handler's KB search (A) will return Low Confidence on every query
by definition — no match is possible.
Runtime behavior: Treat every Intent 01 as immediately unresolvable
from Business Memory. Skip straight to a single clarification attempt
("I want to make sure I get you the right answer — can you tell me a
bit more about what you're looking for?") to confirm this isn't a
phrasing/matching problem, then escalate to Human Handoff Handler
immediately rather than exhausting the full 2-attempt cycle — an
empty KB is a configuration gap, not a customer-communication problem,
and should not be disguised as one by repeated clarification attempts.
Support Handler (B) and Complaint Handler (C) are not affected by an
empty KB — they rely on Customer Memory and Business Config/Business
Context (transaction records, policies), which are a separate data
source from the KB proper.
```

---

#### 4. Edge Cases

```
EC-01: Customer's question is answerable, but only partially — e.g.,
       asks about both pricing (in KB) and a specific edge-case policy
       (not in KB).
       Handling: Apply Step 1F multi-intent resolution — answer the
       confirmed portion (pricing) at full confidence, then treat the
       unconfirmed portion as its own Medium/Low confidence case
       (one clarifying question or escalate that portion specifically,
       not the whole message).

EC-02: Existing customer (Support Handler) message also contains a new
       sales-adjacent question in the same turn.
       Handling: Per the Priority Rule (B) and Step 1E, the support
       component is Blocking (Priority 3) and resolved first; the
       sales-adjacent component is Supporting and, since Core Agent
       alone has no sales authority, is deferred to Growth Agent
       (if active) only after the support matter is closed — never
       answered mid-resolution.

EC-03: Customer is angry (Complaint Handler) but the underlying issue
       turns out to be a misunderstanding, not a real business error.
       Handling: De-escalation sequence still applies in full — do not
       skip acknowledgment because the agent internally "knows" the
       customer is mistaken. Clarify gently using Business Memory as
       the authority, without contradicting the customer's emotional
       experience.

EC-04: Customer requests a human (Intent 07) in the middle of the FAQ
       Handler successfully resolving their question.
       Handling: Human Request is honored immediately regardless of
       how close to resolution the agent is (Step 2 Section 4 —
       explicit human request always requires human takeover,
       regardless of freedom level or agent confidence). Do not finish
       the answer first "because it's almost done."

EC-05: Off-Topic Handler redirect coincides with an actual emergency
       signal embedded in an otherwise off-topic-sounding message
       (e.g., rambling message that contains a real safety concern).
       Handling: Step 1B/1E intent classification runs on every
       message regardless of how the prior message was classified —
       if any component reclassifies as Priority 1 (Safety), it
       overrides the Off-Topic redirect count entirely per Step 1F's
       "when multi-intent requires escalation" rule.

EC-06: KB contains an answer, but it directly conflicts with what
       Customer Memory suggests the customer was told previously by a
       human agent.
       Handling: Per Step 0C Memory Conflict Resolution, Business
       Memory (current KB/policy) outranks Customer Memory. Agent
       follows current KB, and may note the discrepancy once without
       arguing ("I want to make sure you have the most current
       information — here's what's accurate today").
```

---

## STEP 3 MODULE 1 COMPLETION SUMMARY

- **Sub-flows completed:** A. FAQ Handler / B. Support Handler / C. Complaint Handler / D. Human Handoff Handler (with full Human Takeover & Return Path) / E. Off-Topic Handler
- **Decisions made:**
  - Set FAQ Handler's clarification cap at 2 attempts before escalation, matching the Complaint Handler's "two resolution attempts" threshold and the Off-Topic Handler's 2-redirect cap, so Core Agent has one consistent "patience budget" across all its sub-flows rather than a different arbitrary number per handler.
  - Tied FAQ Handler's "found vs. not found" determination directly to the Step 1D.2 Confidence Gate's four states (High/Medium/Low/Conflicting) rather than inventing a separate confidence system specific to this module — keeps the whole document using one shared confidence vocabulary.
  - Defined the empty-KB fallback (Section 3) as short-circuiting to a single clarification attempt rather than the full 2-attempt cycle, on the reasoning that a structurally empty KB is a configuration gap the agent cannot talk its way out of — treating it as a normal not-found case would mean repeatedly asking the customer to rephrase a question that was never answerable, which actively damages trust.
  - Complaint Handler's recovery-opportunity check was written to explicitly defer to Step 1G End State logic rather than redefine it locally, keeping Step 3 as the flow layer and Step 1 as the single source of truth for exit-state mechanics.
- **Open questions:**
  - EC-02 assumes Growth Agent (Module 2, not yet built) is the correct deferred destination for a sales-adjacent question surfaced during Support Handler — this should be re-verified once Module 2's entry conditions are formally defined, in case Module 2 expects a different handoff shape than assumed here.
  - Human Handoff Handler's "context passed to human agent" currently references `conversation_summary` as the carrier field (per Integration Contract) — architect should confirm whether escalation-specific structured data (e.g., which handler/condition triggered it) has its own field in the Integration Contract, or whether it's expected to live inside the conversation_summary text as drafted here.
    - **Resolved (Q2):** Escalation structured data fields named for Integration Contract v2: `escalation_type`, `escalation_reason`, `escalation_priority`, `origin_module`, `trigger_condition`. Not defined in Integration Contract v1 — flagged for next contract revision.
  - The Off-Topic Handler's 2-redirect cap does not yet specify whether the counter resets if the customer returns to on-topic and then goes off-topic again later in the same conversation, or whether it's a cumulative per-conversation count — flagged for architect clarification since it affects long conversations more than short ones.
    - **Resolved (Q3):** Off-topic counter is consecutive, not cumulative. Resets on any on-topic message.
- **Additions applied:** Support→Opportunity Detection (B.1) / Customer Verification Rule (inside B) / Escalation Priority Classification (inside D) / Off-Topic Counter Reset Rule (inside E)
- **Enterprise Expansion Flags** (per Architecture Expansion Rule — not yet in scope, noted for future expansion, not for current MVP decision-making):
  - **Channel-agnostic behavior:** Current spec is chat-centric; enterprise Core Agent must behave identically across WhatsApp, SMS, email, and voice — session state, confidence gating, and handoff mechanics don't yet account for channel-specific constraints (e.g., voice has no persistent transcript the customer can scroll back to, SMS has message-length limits).
  - **Knowledge base freshness detection:** FAQ Handler's confidence model (Section A) treats a KB match as reliable once found; it does not yet detect when a KB entry may itself be stale (e.g., a policy answer that hasn't been reviewed in months) and should carry that uncertainty into the Confidence Gate rather than reporting High Confidence on outdated content.
  - **Proactive support triggers:** All of Module 1 is reactive — it responds to customer-initiated messages. Enterprise Core Agent should also support system-detected proactive outreach (e.g., an order delay detected by an external system triggers the agent to reach out before the customer asks), which is a fundamentally different entry point than anything defined in this module.
- **Batch 2 Phase 3 amendments applied (Part A):** FAQ Handler (Sub-Flow A) now includes a Standing correction invitation (P1, Dietvorst/Simmons/Massey 2018) and a Reasoning requirement for failure/escalation responses (P1, Journal of Business Research Vol. 180, 2024), both inserted immediately after the existing "what agent says when it doesn't know" block.
- **Batch 2 Phase 3 amendments applied (Part B):** Complaint Handler now includes a Proportionality note (P2/B4) after "what agent can offer vs. cannot offer." Human Handoff Handler now includes an Underlying Rationale note (P2/B6, Journal of Retailing and Consumer Services 2020) naming task-complexity as the existing triggers' rationale, inserted after the Entry Condition block — no trigger conditions changed.
- **Ready for architect review:** YES

---

### MODULE 2 — Growth Agent (Active if purchased)

**Purpose:** Create buying momentum. Move customers from interest toward conversion intent. Growth Agent creates desire and clarity — it does not complete the transaction itself; that is the Conversion Engine's job (Module 3). Growth Agent never forces conversion; it creates the conditions under which the customer chooses to move forward on their own. Done well, it feels like a trusted advisor, not a salesperson — consistent with the Employee Mindset defined per archetype in Step 0A.

#### 1. Purpose, Scope & Activation

**What this module does:** Runs discovery when a customer's need isn't yet clear, recommends a best-fit product/service once it is, handles objections and hesitation with the authority it actually holds, detects natural upsell/cross-sell moments, and hands off to Conversion Engine when the customer is ready to act.

**What this module does not do:** It does not create carts, process bookings, apply discounts, or take any action gated behind an action-level permission it doesn't hold (Step 1D.1) — those belong to Conversion Engine (Module 3). It does not override Core Agent's priority rules (Step 3 Module 1 B) — an active support or complaint issue always takes the conversation away from Growth Agent, per Step 1D routing and Step 1E priority order. It does not collect contact information outside a Step 0B Tier trigger — see Section on data collection below.

**What triggers it:** Per Step 1D Module Routing — Intent 01 (Information Seek) or Intent 02 (Problem Aware) when Growth Agent is active in config; Intent 08 (Comparison/Objection) when Growth Agent is active; the Support → Opportunity Detection bridge from Core Agent (Step 3 Module 1, Section B.1) when a customer opens a new need after a resolved support issue.

**What happens if it is OFF (fallback path):** Per Step 1D — Intent 01/02 routes to Core Agent FAQ Handler only (factual KB answers, no discovery or recommendation attempted). Intent 08 routes to Core Agent, which responds factually from KB with no persuasive objection handling. The Support → Opportunity Detection bridge (Module 1, B.1) answers factually from KB only, with no discovery or push, when Growth Agent is OFF. In all OFF cases, the customer is never left without a response — they simply don't receive discovery, recommendation, or objection-handling behavior.

**Data collection stance for this entire module:** Growth Agent follows Step 0B doctrine exactly. Discovery and Recommendation Flows operate on Session Memory only (Step 0C Level 1) — no contact info is requested. The first point at which this module may trigger a Tier 2 (Value Exchange Capture) offer is inside the Recommendation Flow, once a genuine preference has been expressed (Step 0B Section 3, Tier 2 trigger condition) — never earlier, and never as a precondition to continuing discovery.

---

#### 2. Sub-Flows

---

##### A.0 Growth Buying Stage Detection

Growth Agent evaluates customer buying maturity before deciding conversation strategy. This is separate from Intent Classification (Step 1B) — intent decides routing, buying stage decides how the agent behaves once routed.

```
STAGE 1 — EXPLORER
  Customer state: "I am learning. I don't know what I need yet."
  Signals: broad questions, category-level language, no comparison
           markers, low specificity.
  Agent behavior:
    - Educate and simplify — introduce options without overwhelming.
    - No conversion pressure, no commitment asks.
    - Discovery depth: enough to understand general need; do not probe
      for decision signals that aren't there yet.

STAGE 2 — EVALUATOR
  Customer state: "I am comparing. I have options and I'm narrowing."
  Signals: specific feature questions, competitor references, "versus"
           framing, "which is better for X" questions.
  Agent behavior:
    - Clarify differences relevant to the stated comparison criteria.
    - Handle concerns with evidence (per Objection Handling Flow, C).
    - Support the decision — don't restart broad education.

STAGE 3 — READY BUYER
  Customer state: "I want this. I'm looking for the path forward."
  Signals: specific item/service named, timing questions ("how soon"),
           logistics questions ("what do I need to provide").
  Agent behavior:
    - Stop selling. Stop discovery. Remove friction.
    - Move immediately toward Conversion Engine handoff (Section 3)
      per Step 1E Intent 03 reclassification.
```

**Rule:** Never apply a later-stage behavior to an earlier-stage customer (pushing toward conversion before the customer is an Evaluator or Ready Buyer is a disengagement trigger per Step 0A). Never keep an earlier-stage flow running after the customer has clearly advanced (continuing discovery when the customer is a Ready Buyer is friction, not thoroughness).

**Connection to Step 0A:** Buying Stage Detection is the runtime implementation of the Buying Readiness dimension defined per archetype in Step 0A. The stage names here map to the Step 0A scale — Explorer ≈ Exploring/Considering, Evaluator ≈ Deciding, Ready Buyer ≈ Ready.

---

##### A. Discovery Flow

**Entry:** Intent 02 (Problem Aware) — customer has a problem or need but has not specified a clear solution.

**Goal:** Understand the real need before recommending anything. Per the Employee Mindset defined for each archetype in Step 0A, this is diagnosis, not interrogation.

**Freedom level governs how this flow runs** (Step 2, applied here rather than redefined):
```
- Questions per turn, sequence flexibility, and challenge authority
  follow the configured freedom band (Step 2 Section 2), not a fixed
  script.
- The Discovery Budget Rule (Step 2 Section 2.3) governs when to stop:
  before every question, check (1) is the answer necessary for the
  next action, (2) has the customer received value recently or only
  given, (3) is the customer already showing readiness (a buying
  signal reclassifies as Intent 03 and hands off immediately per
  Step 1E — discovery does not "finish" once the customer is ready).
- The Customer Patience Window (Step 0A) sets the outer bound per
  archetype — e.g., Commerce's Short→Medium window means discovery
  here is necessarily shallower than Consultation's Long window even
  at the same nominal freedom score.
```

**Exit:** Need understood at sufficient confidence (Step 1D.2 High or resolved Medium) → move to Recommendation Flow (B) → OR customer supplies a buying signal mid-discovery → Intent reclassified to 03, discovery stops immediately, hands to Conversion Engine per Section 3 below → OR discovery stalls (Low/Conflicting confidence after reasonable attempts, per the archetype's Discovery Budget) → offer the best available partial recommendation or route to Core Agent FAQ Handler rather than continuing to probe against declining patience.

---

##### B. Recommendation Flow

**Entry:** Need is understood (from Discovery Flow, or directly from an Intent 01/02 message that already specifies enough to recommend without further discovery).

**Goal:** Suggest the best-fit product/service for the understood need.

**Rules:**
```
- Maximum recommendations per turn: governed by the configured
  freedom band's "proactive recommendation" rule (Step 2 Section 2) —
  bands 1–4 recommend only if explicitly asked and offer at most one
  option; bands 5–8 may proactively offer one primary recommendation,
  with an alternative only if the customer's response invites it;
  band 9–10 may present a primary and an alternative together if that
  serves clarity.
- Presentation: state the recommendation plainly, tie it explicitly
  to what the customer said they need (mirroring, per Step 0A
  Commerce Employee Mindset — "mirror back what the customer said"),
  and avoid catalog-dump framing (Step 0A Commerce "what causes
  disengagement").
```

**Standing correction invitation:** Every recommendation delivered includes
room for the customer to redirect it, consistent with the Recommendation
Confidence Requirement above. This is not a new discovery cycle — it is a
standing, low-friction door for the customer to say "not quite" without
the agent treating that as an objection to overcome (Objection Handling
Flow, C) rather than as ordinary course correction.

**Source:** Dietvorst, Simmons & Massey (2018).

##### Recommendation Confidence Requirement

Before making any recommendation, the runtime applies the following check (tied to Step 1D.2 Confidence Gate):

```
Check 1: Is the customer's need understood at sufficient confidence?
  NO  → Do not recommend. Return to Discovery Flow (A) or
         clarify once.

Check 2: Does an available solution genuinely match the understood need?
  NO  → Apply No Suitable Recommendation Handling (B.1 below).

Check 3: Can the agent explain the recommendation reason in terms the
         customer stated?
  NO  → The recommendation is not yet ready to deliver — the agent
         cannot tie it back to what the customer said, which means
         either understanding is incomplete (return to Check 1) or
         no genuine match exists (Check 2).

All three checks pass → Proceed with recommendation.
```

**Rule:** Never recommend because the conversation has reached the "recommendation stage." Recommend because a specific need is understood and a specific match exists that can be explained in the customer's own terms.

```
- Upsell timing: never introduced in the same turn as the primary
  recommendation. Upsell is only considered after the customer
  responds positively to the primary recommendation — see Opportunity
  Detection (E) below for the specific mechanics.
```

**Tier 2 data collection trigger point:** Once the customer responds with a genuine preference or interest in the recommendation (not yet full commitment), this is the Step 0B Tier 2 trigger — the agent may now offer a value exchange ("want me to save this and send it to you?"), collecting only the minimum field needed (Step 0B Section 3). This is the earliest point in the entire Growth Agent module where contact info may be requested.

**Exit:** Customer responds positively → Tier 2 offer made if natural (per above) → conversation continues toward Objection Handling (C) if hesitation appears, or toward Conversion Engine handoff (Section 3) if the customer signals readiness → OR customer hesitates → Objection Handling Flow (C) → OR customer declines outright → close per Step 1G End State 1 (if genuinely no interest) or End State 2 (Open Opportunity, if Recovery Engine should evaluate the conversation).

---

##### B.1 No Suitable Recommendation Handling

Sometimes the correct recommendation is no recommendation. Growth Agent must not force-fit a solution when none genuinely matches.

**Trigger:** Customer need is understood but no available option in Business Memory (Step 0C Level 3) genuinely fits it.

```
Wrong:   Agent recommends the "closest" option without disclosing
         the gap — implies the solution fits when it doesn't.
Correct: Agent names the gap honestly, identifies the closest
         available option if one exists, and explains the difference.
```

**Example:**
```
"Based on what you've described, I don't think [available option]
is actually a strong fit — it would handle X but not Y, which you
said matters most. The closest we have is [Z], which covers X.
Would that work for your situation, or should I connect you with
someone who can discuss alternatives?"
```

**Depending on configuration:**
```
Option A (closest alternative): Offer the nearest available option
  with the gap disclosed. Customer decides.
Option B (education path): Provide relevant KB information that
  helps the customer refine or reconsider the stated need.
Option C (human escalation): If the gap is significant and a human
  could resolve it (custom solution, special arrangement), route to
  Human Handoff Handler (Core Agent Module 1, Sub-Flow D).
```

**Rule:** Trust is more commercially valuable than a forced sale. A no-recommendation that protects the customer's interests earns more long-term than a mis-recommendation that erodes them.

**Exit:** Step 1G End State 1 (if the customer is satisfied with the honest answer) or End State 2 (Open Opportunity, if the customer would return once the right solution is available — Recovery Engine evaluation applies).

---

##### C. Objection Handling Flow

**Entry:** Customer hesitates after a recommendation — Intent 08 (Comparison/Objection) or a clear hesitation signal (see Internal Conversation Recovery Flow, D, for the signal list; the two flows share detection logic but differ in scope).

**Objection types and response rules:**
```
PRICE OBJECTION
  Response: Explain value, reframe against what the customer said they
  need, offer options within the existing catalog if relevant.
  No discount authority (Step 1D.1 action-level permission — Growth
  Agent does not hold a discount-granting permission by default; if a
  discount action IS configured/permitted for this deployment, it
  still routes through the same action-permission check, never
  improvised).

TRUST OBJECTION
  Response: Evidence/social-proof path — reference concrete,
  KB-confirmed facts (reviews, guarantees, policies) rather than
  reassurance alone. Never fabricate evidence not in Business Memory
  (Step 0C Level 3).

TIMING OBJECTION
  Response: Save-for-later path — offer to preserve the
  recommendation/progress (Tier 2 capture if not already done) rather
  than pressuring toward an immediate decision. Consistent with Step
  0A "what causes disengagement" across archetypes — pressure after a
  timing objection reliably drives disengagement.

CONFUSION
  Response: Simplify the existing recommendation. Do not add more
  choices — per Step 0A Appointment/Commerce guidance, more options
  increase confusion, they don't resolve it.

COMPETITOR COMPARISON
  Response: Value-focused, never an attack on the competitor. Highlight
  what's true and confirmed about this business's offering. Consistent
  with Step 0A Engagement/Consultation "never attack a competitor"
  guidance, applied module-wide.
```

**Honest consequence framing (addition):** If a real, Business-Memory-
confirmed consequence exists (e.g., genuinely limited availability, a real
seasonal factor), the agent may state it plainly as part of the
save-for-later response. This is distinct from manufactured urgency
(Step 2 §2.2, Risk-Based Freedom Reduction) — the distinguishing test is
whether Business Memory actually confirms the claim. If it doesn't, the
agent does not state it, full stop.

**Source:** Kahneman & Tversky (1979); Ruggeri et al. (2020) — loss/risk
framing is more motivating than equivalent gain framing, when genuinely true.

**Exit:** Objection resolved, customer confidence restored → return to Recommendation Flow (B) or proceed to Conversion Engine handoff if now ready → OR objection persists after the response above → Internal Conversation Recovery Flow (D) evaluates whether to continue, save, or close → OR objection reveals a genuine complaint (e.g., "your reviews are bad because you scammed someone I know") → re-classify as Intent 05, hand to Core Agent Complaint Handler (Step 3 Module 1 C) — Objection Handling is not equipped to de-escalate a trust-broken complaint.

---

##### D. Internal Conversation Recovery Flow

**Purpose:** Recover hesitation before the customer disappears, within the live conversation. This is distinct from the external Recovery Engine (Module 4) — this flow operates in-turn, before the conversation ends.

**Entry:** Hesitation signals detected mid-conversation.

**Signal list (minimum 6):**
```
1. "Too expensive" / any price-related pushback
2. "I'm not sure"
3. "I'll think about it"
4. "Maybe later"
5. "Competitor is cheaper" / any competitor mention paired with hesitation
6. Long pause / delayed response after a recommendation
7. Short, disengaged replies after previously detailed ones (tone drop)
```

**Hesitation type identification logic:**
```
Map the detected signal to one of Objection Handling's (C) categories
— Price / Trust / Timing / Confusion — using the same classification
logic. This flow does not invent a separate taxonomy; it is the
early-detection layer that feeds into (C)'s response rules.
```

**Response rules per type:** Identical to Objection Handling Flow (C) — Price → value/no discount, Trust → evidence, Timing → save-for-later, Confusion → simplify. This flow's distinct contribution is the *check* below, which Objection Handling alone does not define.

**Check — if hesitation remains after the appropriate (C) response:**
```
Recovery Engine active?
  YES → Create recovery opportunity if criteria match (per Step 3
        Module 4 Recovery Trigger Definition, once that module is
        built — for now, per Step 0B Section 4.1, at minimum a Soft
        Lead Record exists if Tier 2 capture already completed).
  NO  → End the conversation positively. No pressure, no repeated
        asks. Per Step 1G End State 2 (Open Opportunity) — Soft Lead
        Record only, no further automated follow-up.
```

**Exit conditions:** Hesitation resolved → return to Recommendation Flow (B) → OR hesitation persists and Recovery Engine check completes (either branch above) → close per Step 1G End State 2.

---

##### E. Opportunity Detection

**Entry:** Any point in the conversation once a primary need is already being served (i.e., not during initial Discovery — introducing a second need before the first is understood would violate Step 0A's "don't push upsell before the primary need is addressed").

**Signals indicating an upsell/cross-sell moment:**
```
- Customer has responded positively to the primary recommendation
  (Recommendation Flow, B, has reached a positive response).
- Customer's stated need naturally implies a complementary need (e.g.,
  a stated occasion or use case that a second item/service serves).
- Customer asks a question that itself signals a broader need than
  the current recommendation covers.
```

**Rules for introducing upsell (timing, max attempts):**
```
- Never in the same turn as the primary recommendation (per
  Recommendation Flow, B).
- Maximum one upsell offer per conversation, framed as optional and
  easily declined — consistent with Step 0A's "upsell offered like a
  friendly suggestion... never before" (Appointment) and "every upsell
  optional and customer-led" (Commerce) guidance.
- If declined, the agent does not re-offer the same or a different
  upsell later in the same conversation.
```

**Rules for NOT introducing upsell:**
```
- Never during Complaint Handler context (Step 3 Module 1 C) — Core
  Agent's de-escalation sequence explicitly forbids selling during
  complaint resolution, and Growth Agent does not override that.
- Never during Support Handler context (Step 3 Module 1 B) unless the
  Support → Opportunity Detection bridge (B.1) has explicitly handed
  off a new, customer-initiated need — Growth Agent does not
  introduce its own upsell into a still-open support conversation.
- Never before the primary recommendation has received a positive
  response.
```

---

#### 3. Handoff to Conversion Engine

**Exact trigger condition for handoff:** Customer intent reclassifies as Intent 03 (Solution Aware) — per Step 1E, this always outranks the in-progress Growth Agent flow (Priority 4 vs. Priority 5), so the handoff is immediate, not something Growth Agent chooses to delay in order to "finish" discovery or recommendation.

**What data must be ready before handoff:**
```
- The specific product/service identified (from Discovery/
  Recommendation, held in Session Memory).
- Any Tier 2 contact info already captured (Step 0B), passed along so
  Conversion Engine does not re-ask.
- Relevant objection context if one was resolved (e.g., a timing
  concern that was addressed) — so Conversion Engine doesn't re-trigger
  it unnecessarily.
```

**Fallback if Conversion Engine is OFF:** Per Step 1D — the agent responds, "I can share details, but bookings/purchases are handled by our team," then offers the best available fallback: a Tier 3 capture if the customer wants to be contacted to complete the transaction, or a direct link/handoff per archetype config. Growth Agent never attempts to simulate a conversion action itself when Conversion Engine is OFF — that would be exceeding its action-level permissions (Step 1D.1).

---

#### 4. Growth Event Tracking

Growth Agent records key events for analytics and business intelligence. This data improves future performance and populates dashboard metrics — it is never used to apply pressure to the customer or referenced back to the customer within the conversation.

**Events to record:**
```
DISCOVERY EVENTS:
  - Buying stage detected (Explorer / Evaluator / Ready Buyer)
  - Primary need identified
  - Discovery depth reached (number of questions before
    recommendation)

RECOMMENDATION EVENTS:
  - Solution recommended (which one, and the matching reason)
  - Recommendation confidence level at time of delivery
  - Customer response (positive / hesitation / decline)
  - No-suitable-recommendation case triggered (B.1)

OBJECTION EVENTS:
  - Objection type detected (Price / Trust / Timing / Confusion /
    Competitor)
  - Resolved or unresolved
  - Which response path was applied (C)

OPPORTUNITY DETECTION EVENTS:
  - Upsell offered (yes/no, which item/service)
  - Accepted / declined

EXIT EVENTS:
  - Handoff to Conversion Engine (intent-reclassified, Intent 03)
  - Abandoned (Internal Conversation Recovery triggered, D)
  - Recovery candidate flagged (Recovery Engine check fired, D)
  - Closed — no suitable recommendation (B.1)
```

**Privacy rule:** Event tracking data informs agent behavior within the conversation silently. It is never surfaced to the customer as a reference point (e.g., agent must not say "since you hesitated on price earlier" — this creates the surveillance feeling prohibited in Step 0C Section 4). Tracked events are internal context only.

**Planned fields for Integration Contract v2:** `growth_buying_stage`, `recommended_solution`, `recommendation_reason`, `objection_type`, `objection_resolved`, `upsell_offered`, `upsell_accepted`, `growth_exit_type`.

---

#### 5. Edge Cases

```
EC-01: Customer expresses a buying signal (Intent 03) in the very
       first message, before any Discovery Flow has run.
       Handling: Discovery is skipped entirely — Step 1E's priority
       system means Solution Aware always outranks Problem Aware, and
       there is no requirement that Discovery run before every
       conversion. Hand off to Conversion Engine (or fallback)
       immediately, per Section 3.

EC-02: Customer raises a competitor comparison (Intent 08) that is
       also, underneath, a genuine trust objection — not simple
       price comparison.
       Handling: Classify by underlying signal, not surface phrasing —
       "X is cheaper" framed with frustration is a Trust objection
       (Objection Handling Flow, C), not a pure Price objection; apply
       the Trust response (evidence-based), not the Price response
       (value reframe alone).

EC-03: Customer accepts a recommendation, but the Tier 2 data
       collection offer is declined ("I'll give you my info later" —
       Step 0B edge case).
       Handling: Accept immediately without pushback (per Step 0B),
       continue toward the customer's goal. If the customer later
       shows a buying signal, hand off to Conversion Engine per
       Section 3 without the Tier 2 info — Conversion Engine's own
       Tier 3 capture (at commitment) will collect what's needed at
       that point instead.

EC-04: Opportunity Detection (E) identifies an upsell moment, but the
       primary recommendation conversation is happening inside a
       Consultation archetype at a low configured freedom level
       (Step 2.1 — configured freedom may differ from archetype
       default).
       Handling: Freedom level, not archetype identity, governs
       whether the upsell may be proactively offered at all — a
       low-configured-freedom Consultation deployment follows the
       "recommend only if asked" rule (Step 2 bands 1–4) even though
       Consultation's default is 8/10.

EC-05: Discovery Flow is mid-question when a Priority 1 (Safety) or
       Priority 2 (Complaint) signal appears in the same message as a
       discovery answer.
       Handling: Per Step 1F, a Priority 1/2 component overrides the
       entire multi-intent resolution order — Discovery halts
       immediately regardless of how much freedom-level latitude or
       Discovery Budget remains; route to the appropriate Core Agent
       handler (Step 3 Module 1) first.

EC-06: Customer's hesitation (Internal Conversation Recovery Flow, D)
       is actually caused by the agent having misunderstood the need,
       not genuine price/trust/timing/confusion hesitation.
       Handling: Before applying a (C)-style response, check the
       Confidence Gate (Step 1D.2) retroactively — if the original
       Discovery/Recommendation was made at Medium confidence or
       lower, treat this as a Confusion-type case requiring
       simplification and re-confirmation of the actual need, not as
       a Price/Trust/Timing objection to be argued against.
```

---

## STEP 3 MODULE 2 COMPLETION SUMMARY

- **Sub-flows:** A.0 Growth Buying Stage Detection / A. Discovery Flow / B. Recommendation Flow / B.1 No Suitable Recommendation Handling / C. Objection Handling Flow / D. Internal Conversation Recovery Flow / E. Opportunity Detection
- **Decisions made:**
  - Positioned the Tier 2 data-collection trigger specifically inside Recommendation Flow (B), at the moment of positive customer response to a recommendation — not in Discovery (too early, no preference expressed yet) and not deferred entirely to Conversion Engine (would mean Growth Agent never captures anything, contradicting Step 0B's per-archetype mapping table where Growth-adjacent flows are explicitly the Tier 2 trigger for Commerce/Consultation/Engagement).
  - Made Internal Conversation Recovery Flow (D) explicitly reuse Objection Handling Flow (C)'s response-type classification rather than defining a separate hesitation taxonomy, since the Execution Plan describes them as closely related (D is early-detection, C is the response mechanism) — treating them as one shared system prevents the two flows from drifting into inconsistent objection-handling logic over time.
  - Opportunity Detection (E) was capped at one upsell offer per conversation with no re-offering after decline, which is stricter than the Execution Plan's original text (which only said "rules for introducing upsell (timing, max attempts)" without specifying the number) — chosen to align with Step 0A's repeated cross-archetype guidance that upsell pressure is a disengagement trigger, treating "max attempts" conservatively by default.
  - Handoff to Conversion Engine (Section 3) was written to trigger strictly off Step 1E's Intent 03 reclassification rather than a Growth-Agent-internal "readiness score," keeping intent classification as the single source of truth for when a handoff occurs rather than introducing a parallel readiness concept this module would own.
- **Open questions:**
  - EC-04 assumes Step 2.1's "configured freedom may override archetype default" applies cleanly to Opportunity Detection's upsell timing — architect should confirm this is the intended interaction, since Opportunity Detection wasn't explicitly enumerated in Step 2's worked examples.
    - **Resolved (Q1):** Confirmed: Opportunity Detection depends on module active + action permission + freedom level + customer psychology, in that order. Low configured freedom (bands 1–4) means upsell offered only if customer explicitly asks, regardless of archetype default.
  - This module assumes Conversion Engine (Module 3, not yet built) accepts a handoff payload containing "product/service identified + Tier 2 info if captured + resolved objection context" — this should be re-verified once Module 3's entry conditions are formally defined, in case the expected handoff shape differs.
    - **Resolved (Q2):** Conversion Engine handoff payload conceptually defined as: `intent`, `selected_solution`, `customer_preferences`, `resolved_objections`, `pending_questions`, `captured_contact_fields`, `source_module`. Named for Integration Contract v2.
  - Recovery Engine (Module 4, not yet built) is referenced in the Internal Conversation Recovery Flow (D) check as the gate for creating a recovery opportunity — the actual trigger criteria are deferred to Module 4's own build; this module only defines the check-and-branch, not the criteria themselves.
    - **Resolved (Q3):** Recovery trigger criteria correctly deferred to Module 4. Module 2 defines the check-and-branch only.
  - Customer-re-initiated upsell after agent decline flagged for Step 5 Stress Test Library — one-offer rule applies to agent-initiated offers only; customer-initiated re-entry is a separate case not yet defined.
- **Additions applied:** Growth Buying Stage Detection (A.0) / Recommendation Confidence Requirement (inside B) / No Suitable Recommendation Handling (B.1) / Growth Event Tracking (Section 4, Edge Cases renumbered to Section 5)
- **Enterprise Expansion Flags** (per Architecture Expansion Rule — not yet in scope, noted for future expansion, not for current MVP decision-making):
  - **Cross-session behavioral context:** A.0's Buying Stage Detection currently reads only from the current session. It does not yet define rules for whether/how repeated cross-session behavior (e.g., a returning customer who has viewed the same item five times across visits) should inform stage detection or recommendation confidence — this needs explicit rules rather than being left to inference, especially given Step 0C's privacy boundary against surfacing frequency/count data directly to the customer.
  - **Inventory-aware recommendation:** Recommendation Flow (B) and the Recommendation Confidence Requirement do not yet factor in stock/availability level as a confidence or urgency input — low stock could reasonably shift from "recommend and mention urgency" to "recommend an in-stock alternative," but this distinction isn't defined.
  - **Product/service relationship graph:** Opportunity Detection (E) currently treats upsell as a single undifferentiated category. Enterprise deployments need a defined relationship model — what genuinely complements what, and which combinations should never be suggested together (bad-experience pairings) — rather than leaving "what to suggest" entirely to unstructured judgment.
  - **Persona-based discovery adaptation:** Discovery Flow (A) assumes one discovery style per archetype/freedom-level combination. It does not yet distinguish B2B buyer psychology from consumer buyer psychology within the same archetype (e.g., a Consultation lead buying on behalf of a company vs. an individual) — these plausibly warrant different discovery depth and framing even at the same freedom score.
- **Batch 2 Phase 3 amendments applied (Part A):** Recommendation Flow (Sub-Flow B) now includes a Standing correction invitation (P1, Dietvorst/Simmons/Massey 2018), inserted immediately after the existing Presentation rules paragraph.
- **Batch 2 Phase 3 amendments applied (Part B):** Objection Handling Flow (C), Timing subtype, now includes an Honest consequence framing note (P2/B1, Kahneman & Tversky 1979; Ruggeri et al. 2020), inserted after the objection-type code block, before Exit conditions.
- **Pre-Step-4 Rename applied:** Module renamed "Revenue Agent" → "Growth Agent" throughout (module numbering unchanged — still Module 2). Rename scope: every occurrence across `Agent_Runtime_System_v1.md`, `Stress_Test_Library_v1.md`, `Architecture_Diff_Report_v1.md`, `customer_psychology_principles_v1.md`, and all flowchart files, including the flowchart filename itself (`Revenue_Agent_Flow.md` → `Growth_Agent_Flow.md`) and its cross-references from other flowchart files. Extended by judgment to directly-derived forms of the same identity: hyphenated compound ("Revenue-Agent-internal" → "Growth-Agent-internal"), module-abbreviation lists ("Core/Revenue/Conversion..." → "Core/Growth/Conversion..."), the module's own sub-feature section titles ("A.0 Revenue Buying Stage Detection" → "A.0 Growth Buying Stage Detection"; "Revenue Event Tracking" → "Growth Event Tracking"), and their underlying snake_case field names (`revenue_buying_stage`/`revenue_exit_type`/`revenue_agent` → `growth_buying_stage`/`growth_exit_type`/`growth_agent`). Internal Mermaid node IDs in flowchart source (e.g., `RevenueAgent`, `RevGate`, `ToRevenue`) were deliberately left unchanged as internal identifiers, not display text — flagged for architect awareness, not applied as a judgment call requiring approval before proceeding, since it doesn't affect rendered output. Verification grep for "Revenue Agent" across all in-scope files returned zero results.
- **Ready for architect review:** YES

---

### MODULE 3 — Conversion Engine (Active if purchased)

**Purpose:** Turn confirmed intent into a completed business outcome. By the time a message reaches this module, the customer has already decided — Intent 03 (Solution Aware) has been classified and, per Step 1E, has outranked whatever else was in progress. Conversion Engine does not convince; Growth Agent's job (Module 2) is already done or was never needed. This module's only job is to remove friction between "the customer wants this" and "the transaction is complete."

#### 1. Purpose, Scope & Activation

**What this module does:** Executes the specific conversion action for the archetype/mode configured — cart creation, reservation, booking, scored consultation booking, callback dispatch, or registration — collects the minimum required data to complete that action (Tier 3, Step 0B), and confirms completion back to the customer in unambiguous terms.

**What this module does not do:** It does not run discovery, does not recommend, does not handle objections (those are Growth Agent's domain, Module 2 — if an objection surfaces here, e.g. a last-second price pushback, it is reclassified per Step 1E and handed back). It does not perform any action without the corresponding action-level permission (Step 1D.1) — cart creation, booking creation, and registration are each independent permissions; module activation alone does not grant them.

**Activation:** Per Step 1D — Intent 03 with Conversion Engine active in config.

**Fallback if OFF:** Per Step 1D — "I can share details, but bookings/purchases are handled by our team," followed by the best available non-transactional fallback (link, Tier 3 capture for human follow-up, or direct handoff per archetype config). Identical to the fallback Growth Agent already describes in its own Section 3 — this module being OFF does not change what the customer is told, only which module says it.

**Accepting the Growth Agent handoff payload cleanly:** When arriving via Module 2's handoff (its Section 3), the payload — `intent`, `selected_solution`, `customer_preferences`, `resolved_objections`, `pending_questions`, `captured_contact_fields`, `source_module` — is treated as authoritative Session Memory. Conversion Engine never re-asks for a field already present in `captured_contact_fields`, never re-recommends the `selected_solution`, and never re-opens a `resolved_objection`. If Intent 03 arrives without a handoff payload (e.g., the customer's very first message was already a direct booking request), Conversion Engine proceeds from a clean state and collects everything itself, per Section 4 below.

---

#### 1.1 Conversion State Machine

Every conversion follows a controlled lifecycle. These are the only valid states — no intermediate or improvised states are permitted. Customer-facing confirmation happens ONLY after CONFIRMED state.

```
INTENT_CONFIRMED
  Meaning: Customer has expressed Intent 03. No transaction action
           has started yet. Data collection may begin.

DATA_COLLECTION
  Meaning: Tier 3 required fields are being collected from the
           customer. No external system has been called yet.

ACTION_PENDING
  Meaning: External system action has been initiated (cart creation,
           calendar write, registration submission). Awaiting result.
           Do NOT confirm to customer during this state.

CONFIRMED
  Meaning: External system returned a success response. Customer may
           now receive explicit confirmation. This is the only state
           from which a confirmation message is sent.

FAILED_RECOVERABLE
  Meaning: Action failed but a defined fallback path exists.
  Examples: Cart API failed → Mode B (product link) available.
            Calendar write failed → Mode B (request booking) applies.
  Action: Execute fallback path. Do not expose technical failure
          language to the customer — transition smoothly.

FAILED_ESCALATION
  Meaning: No safe automated recovery exists. Human required.
  Examples: Emergency dispatch queue write fails.
            All fallback modes unavailable or fail.
  Action: Route to Human Handoff Handler immediately.

CANCELLED
  Meaning: Customer explicitly cancelled mid-conversion (e.g.,
           "never mind" or "I changed my mind" during DATA_COLLECTION
           or ACTION_PENDING). Terminal state.
  Action: End conversation gracefully. Do NOT create a recovery record
          for a deliberate cancellation — distinguish from abandonment
          (customer stops responding) which is Step 1G End State 4
          and is Recovery Engine-eligible.
```

**Rule:** Customer-facing confirmation only after CONFIRMED state. Never during ACTION_PENDING. A "confirmation" sent while the system is still processing is a false confirmation — per the universal failure rule in Section 5, this is worse than transparency.

#### 1.2 Duplicate Action Protection

Before creating any conversion action, the runtime checks whether an active conversion for this customer already exists.

```
Check before any new conversion action:
  Does an active record exist for:
    - same customer (matched by contact method, per Step 0C 4.1)
    - same conversion type (booking/cart/reservation/registration)
    - same item/service/time window

  YES → Do not create a duplicate. Confirm the existing action.
        Example: "You're already confirmed for [time/item] —
                  is there anything else you need?"

  NO  → Proceed with conversion action normally.
```

**Trigger pattern this prevents:**
```
Customer: "Book it"
Customer (next message): "Actually yes, book it"
Wrong result: Two appointments created.
Correct result: "You're already confirmed for [time]."
```

**Rule:** Repeat confirmations should reinforce customer confidence, not duplicate actions. This is especially critical for Appointment and Emergency archetype flows where duplicate records create real operational problems.

---

#### 2. Conversion Modes Table

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

| Mode | Commerce (Ecom) | Commerce (Restaurant) | Appointment | Consultation | Emergency | Engagement |
|---|---|---|---|---|---|---|
| **A** | Agent cart fill → checkout link | Reservation direct | Direct booking (calendar) | Scored booking (score ≥ 50) | Callback queue (15 min) | Direct registration |
| **B** | Guided to product page | Waitlist entry | Request booking (human confirms) | Open booking (no scoring) | Inspection slot booking | Guided to form |
| **C** | Lead handoff to human | Event/catering handoff | Human callback | Human priority (score ≥ 85) | Emergency escalation | Human handoff |

**Config flag controlling active mode, per archetype:**
```
Commerce (Ecom):        conversion_mode = agent_cart | guided_link |
                         lead_handoff — set per client based on
                         whether a cart-creation API integration
                         exists (Mode A requires it; without it,
                         config defaults to Mode B).
Commerce (Restaurant):  conversion_mode = direct_reservation |
                         waitlist | event_handoff — Mode selection is
                         situational within a single deployment (see
                         Section 3 below), not a single fixed choice.
Appointment:            conversion_mode = direct_booking |
                         request_booking — Mode C (human callback) is
                         a fallback state, not a standing config
                         choice, triggered when A/B both fail (see
                         Failure Handling, Section 5).
Consultation:           consultation_scoring_enabled = true | false
                         selects between Mode A (scored) and Mode B
                         (open, no scoring) as the deployment's
                         baseline. Mode C (human priority, score ≥ 85)
                         is not a separate config choice — it is an
                         automatic escalation that fires within Mode A
                         whenever the score threshold is crossed.
Emergency:               Mode A vs. B is determined by urgency
                         classification at runtime (Step 0A Emergency
                         psychology), not a static config flag — an
                         active-danger message always routes to Mode A
                         (callback queue); a research/non-urgent
                         inspection request routes to Mode B. Mode C
                         is the safety-escalation path, always
                         available regardless of config.
Engagement:              conversion_mode = direct_registration |
                         guided_form — selected per conversion type
                         (donate/volunteer/attend) based on whether a
                         direct registration integration exists for
                         that specific type; Mode C (human handoff) is
                         the fallback when neither integration exists
                         or the request doesn't fit either.
```

---

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
Emergency:              TWO separate checks, not one:
                        (a) Human available to receive/process the
                        dispatch request (Flag 2, already built)
                        (b) Team/technician actually available to be
                        physically dispatched — no live capacity feed
                        exists to validate this automatically in v1;
                        resolved for v1 via the config-driven fallback
                        below (see addition, Section 8, Step 2.5), not
                        by building the feed. Full automated validation
                        remains deferred to v2.
Consultation:           Human/specialist availability for the specific
                        score-tier routing (Mode C priority handoff) —
                        no live specialist-availability feed exists to
                        validate this automatically in v1; resolved for
                        v1 via the same config-driven fallback pattern
                        (see Archetype 5 — Consultation, Mode C). Full
                        automated validation remains deferred to v2.
Engagement:             Program/event capacity check — Engagement's
                        Step 4 build (Volunteer Confidence Gate, §5)
                        assumes Business Memory CAN contain this data;
                        no live-capacity data feed exists to keep it
                        current automatically in v1; resolved for v1 via
                        the same config-driven fallback pattern (see
                        Archetype 4 — Engagement, Registration Flow).
                        Full automated validation remains deferred to v2
                        (Appendix C gap list item 13, updated).
```

**v1 Fallback Configuration — Team/Specialist/Capacity Checks:** None of
these three checks has a live data feed to validate against
automatically in v1 (a calendar API confirms a *slot* is free, not that
the *correct team/specialist/program capacity* is available — this is a
data-integration gap, not a decision-logic gap). Rather than leave the
action uncheckable, each of the three archetypes exposes a
per-archetype, client-configurable mode that defers the actual
capacity/specialist/team confirmation to a human, instead of having the
agent assert it automatically:

```
client_config.emergency_booking_mode (Emergency — NEW field):
   "direct_calendar"    → CreateInspectionSlotBooking / dispatch queue
                          entry writes directly, same as a normal
                          confirmed booking. Client accepts that team
                          capacity is not independently verified.
   "dashboard_request"   → writes to Zenny's own dashboard as a pending
                          request; a human confirms team capacity before
                          it becomes a real dispatch commitment.

client_config.consultation_specialist_check_mode (Consultation — NEW
field):
   "direct_confirm"      → Mode C priority handoff proceeds immediately,
                          same as today. Client accepts specialist
                          availability is not independently verified.
   "dashboard_request"    → Mode C handoff is created as a pending
                          request; a human confirms specialist
                          availability before it is presented to the
                          customer as confirmed.

client_config.engagement_capacity_check_mode (Engagement — NEW field):
   "direct_confirm"      → Registration completes immediately, same as
                          today. Client accepts program capacity is not
                          independently verified.
   "dashboard_request"    → Registration is created as a pending
                          request; a human confirms capacity before it
                          is presented to the customer as confirmed.
```

**Default when unspecified:** `dashboard_request` for all three — this is
the v1-safe default precisely because none of the three has a live
capacity feed. A client may opt into `direct_calendar`/`direct_confirm`
knowingly accepting the reduced-verification tradeoff; the agent does
not decide this itself (CLAUDE.md Rule 2).

**Wording consequence (applies to all three, not just Emergency):**
Under `dashboard_request` mode, the agent must never say "you're booked"
or an equivalent confirmed-outcome phrase — it must say something to the
effect of "I've submitted this request — you'll be notified once it's
confirmed," per the standing rule that the agent must never imply a
confirmed action that hasn't happened. Under `direct_calendar`/
`direct_confirm` mode, existing confirmed-outcome language is unchanged.

**Universal fallback rule (applies regardless of archetype):** If
availability validation fails, the agent does NOT simply report failure
and stop. It follows the same graceful-degradation pattern already
established system-wide (CLAUDE.md Rule 2, Step 1D's fallback
requirement): offer the nearest available alternative, or fall to the
next Mode (A → B → C), per the specific archetype's existing Mode
fallback chain. This section does not introduce new fallback logic — it
names the existing pattern. Where a live capacity/specialist/team feed
does not exist (all three cases above), the v1 Fallback Configuration
just defined is the resolution, not an unresolved gap.

**Related:** For the named A/B/C/D fallback pattern vocabulary these
checks and their fallback chains follow, see
`06_Infrastructure/Fallback_Pattern_Catalog.md`.

---

#### 3. Full Flow Per Archetype

---

##### COMMERCE — ECOMMERCE

**Mode A — Agent Cart Creation:**
```
1. Confirm the exact item/variant from Session Memory (from Growth
   Agent handoff's selected_solution, or collected fresh if arriving
   direct).
2. Action Permission Check (Step 1D.1): is "create cart" action-level
   permission granted?
   NO → fall through to Mode B automatically, do not attempt.
3. Call cart-creation API dependency with confirmed item/variant/
   quantity.
4. On success: present checkout link, confirm total cost upfront (per
   Step 0A Ecom "what creates confidence" — no hidden costs).
5. Collect Tier 3 fields (Step 0B) only if checkout requires them
   beyond payment (e.g., delivery details) — payment itself is
   typically handled by the checkout link's own flow, not by the
   agent.
Exit: Cart created and link delivered → Step 1G End State 1
   (Successful Completion, pending actual purchase — Conversion
   Record status "Pending" per Integration Contract until payment
   confirms).
```

**Mode B — Guided to Product Link:**
```
1. Confirm the exact item/variant (as above).
2. Provide a direct, specific link to the product page — never a
   generic category/homepage link (per Step 0A "generic responses"
   disengagement trigger).
3. Agent says: "Here's the direct link to [item] — everything you
   need is right there, including sizing/options."
Exit: Link delivered → Step 1G End State 2 (Open Opportunity) unless
   customer confirms they've completed the purchase in-session, in
   which case End State 1.
```

**Mode C — Lead Handoff to Human:**
```
Trigger: Cart value escalation threshold exceeded, OR Mode A/B both
   unavailable/failed, OR customer explicitly requests a human for
   this purchase.
1. Capture Tier 3 fields (name + email or phone) framed as part of
   completing the handoff, not a separate ask.
2. Route to Human Handoff Handler (Core Agent Module 1, Sub-Flow D)
   with Priority 2 (Standard) per that module's Escalation Priority
   Classification, unless the trigger itself is urgent.
Exit: Step 1G End State 5 (Escalated to Human).
```

---

##### COMMERCE — RESTAURANT

**Reservation Flow (Mode A — direct):**
```
1. Confirm party size, date, time from Session Memory/handoff or
   collect fresh.
2. Party size gate: IF party size ≥ 10 → do not confirm directly,
   route to Mode C (Event/Catering Handoff) — per Step 0A Commerce
   Restaurant edge case, this threshold shifts customer psychology
   from "confident booker" to needing reassurance; agent explains
   this plainly ("for parties of 10 or more we handle it through our
   events team so we can get you properly set up") rather than
   silently declining.
3. Time validation: IF requested time has already passed (per current
   timestamp) → flag naturally, not robotically: "just to check —
   did you mean tonight, or [next occurrence of that time]?"
4. IF slot available → confirm reservation, create calendar_event_id
   (per Integration Contract Calendar Standards), state booking_status
   = "Confirmed" explicitly to the customer ("you're confirmed for
   7:30, table for 4" — per Step 0A "what creates confidence").
5. IF slot unavailable → check waitlist config (Mode B).
Exit: Confirmed → Step 1G End State 1. Time-passed correction resolved
   → return to step 1 with corrected time.
```

**Waitlist Entry (Mode B):**
```
Trigger: No slots available at requested time, AND waitlist_enabled
   config flag is true.
1. Offer waitlist explicitly: "I don't have that exact time, but I
   can add you to the waitlist and reach out if it opens up — want me
   to do that?"
2. If accepted, collect Tier 3 fields (name + contact) as part of the
   waitlist entry itself.
IF waitlist_enabled is false: state unavailability plainly and offer
   the nearest actually-available alternative time instead of a
   waitlist.
Exit: Waitlisted → Step 1G End State 2 (Open Opportunity, Recovery
   Engine may evaluate per Step 3 Module 4 once built).
```

**Event/Catering Handoff (Mode C):**
```
Trigger: Party size ≥ 10, OR explicit private event/catering inquiry.
1. Acknowledge specifically (per Step 0A "what creates confidence" —
   not a generic decline).
2. Capture Tier 3 fields as part of the handoff.
3. Route to Human Handoff Handler, Priority 2 (Standard) — not urgent
   unless the event date is imminent.
Exit: Step 1G End State 5.
```

---

##### APPOINTMENT

**Direct Booking Flow (Mode A):**
```
1. Confirm service, date, time, practitioner (if applicable) from
   Session Memory/handoff or collect fresh.
2. Action Permission Check (Step 1D.1): "reserve slot" permission
   granted?
   NO → fall to Mode B (Request Booking).
3. Check calendar availability (per Integration Contract Demo Phase
   Rules: availability check via Google Calendar; production may use
   Google FreeBusy/Calendly per Production Upgrade Notes).
4. IF available → create calendar event, confirm explicitly ("you're
   booked for [service] on [date] at [time] with [practitioner]").
   Collect Tier 3 fields (name + contact) as part of confirming, plus
   any special request (allergy/accessibility) already flagged in
   Session Memory, bundled into this same step per Step 0A Appointment
   guidance.
5. IF unavailable → Availability Conflict Handling (below).
Exit: Confirmed → Step 1G End State 1.
```

**Request Booking Flow (Mode B — human confirms):**
```
Trigger: "reserve slot" permission not granted, or calendar
   integration unavailable.
1. Collect preferred date/time and Tier 3 contact fields, framed as
   "I'll get this requested and someone will confirm shortly."
2. Create a Pending booking record (booking_status = "Pending" per
   Integration Contract) rather than a confirmed one — never imply
   confirmation the agent cannot guarantee (per Step 0A "uncertain
   booking language" disengagement trigger — the agent must instead
   be clear that this is a request, not a confirmation).
Exit: Step 1G End State 2 (Open Opportunity) until human confirms,
   at which point the record updates to End State 1 outside this
   conversation.
```

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

**Availability Conflict Handling:**
```
IF requested slot unavailable:
  1. Offer the nearest available alternatives (2-3 options) rather
     than a bare "not available."
  2. IF no alternatives fit the customer's stated constraints →
     Mode C (Human Callback): capture Tier 3 fields, route to Human
     Handoff Handler Priority 3 (Review) — this is a scheduling gap,
     not an urgent matter.
```

---

##### CONSULTATION

**Score Gate Logic (hard gate: score ≥ 50):**
```
Precondition: This flow assumes lead scoring has already run (scoring
   mechanism itself is Business Memory / external system logic, not
   defined by this runtime document — Conversion Engine consumes the
   score, it does not calculate it).

IF consultation_scoring_enabled = false:
  → Mode B (Open Booking) applies unconditionally — proceed directly
    to booking collection, no gate.

IF consultation_scoring_enabled = true:
  Score < 50  → Do NOT offer direct booking. Route to nurture path
               (below) instead of Conversion Engine completing an
               action.
  Score 50–84 → Mode A (Scored Booking) — proceed to booking.
  Score ≥ 85  → Mode C (Human Priority) — do not complete a
               self-service booking; escalate directly to a human
               with priority framing (see below), even though the
               customer may be ready to book themselves.
```

**Score Tier Routing:**
```
SCORE < 50 — NURTURE PATH:
  Agent: "Based on what we've discussed, I want to make sure you get
  the right depth of attention — I'll have someone follow up with you
  directly rather than booking something that might not be the best
  fit yet."
  Action: Tier 3 capture (if not already held from Growth Agent
  handoff) for follow-up purposes. No booking created. Exit: Step 1G
  End State 2 (Open Opportunity) — Recovery Engine evaluates per
  Module 4.

SCORE 50–84 — MODE A, SCORED BOOKING:
  Standard booking flow: confirm date/time, collect Tier 3 fields not
  already held, create calendar event, confirm explicitly.
  Exit: Step 1G End State 1.

SCORE ≥ 85 — MODE C, HUMAN PRIORITY:
  Agent: "This sounds like exactly the kind of situation our team
  should speak with you directly about — let me get you connected
  right away rather than booking a standard slot."
  Action: Tier 3 capture if not already held, route to Human Handoff
  Handler with Priority 1 (Immediate) per Module 1's Escalation
  Priority Classification — a high-value qualified lead is time-
  sensitive commercially even though it is not a safety matter.
  Specialist availability itself is not independently verified in v1
  (no live specialist-availability feed exists — Module 3 §2.1's v1
  Fallback Configuration). Under
  `client_config.consultation_specialist_check_mode = "dashboard_request"`
  (v1-safe default), this handoff is created as a pending request and
  a human confirms specialist availability before it is presented to
  the customer as confirmed — the agent's language above ("let me get
  you connected") already satisfies this since it does not assert a
  completed connection. Under `"direct_confirm"` mode, the client
  accepts the reduced verification.
  Exit: Step 1G End State 5.
```

---

##### EMERGENCY

**Callback Queue Flow (Mode A — 15 minute window):**
```
Trigger: Active/urgent situation per Step 0A Emergency psychology
   classification (not a static config choice — determined by message
   content at runtime).
1. Confirm location and Tier 3 contact fields — per Step 0B, Emergency
   is Tier 3-only, immediate, no earn-it-first step.
2. State a concrete time window explicitly: "a technician will call
   you within 15 minutes" (per Step 0A "what creates confidence" —
   never a vague promise).
```

**New Step 2.5 — Team Availability Check:** Before creating the callback
queue entry, confirm a technician/team is actually available for dispatch
in the customer's service area within the communicated window — this is
distinct from Flag 2's "is a human available to receive the callback
request" check (which is about someone answering the queue, not about
field capacity). No live team-capacity feed exists in v1 to make this
determination automatically (Module 3 §2.1's v1 Fallback Configuration):
under `client_config.emergency_booking_mode = "dashboard_request"` (the
v1-safe default), this check is deferred to the human confirming the
pending request rather than performed by the agent. Under
`"direct_calendar"` mode, the check below still applies as written, and
the client accepts the reduced verification. If no team is available in
the relevant window:
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
3. Create callback queue entry (job queue action-level permission,
   Step 1D.1 — if not granted, fall to Mode C directly, do not attempt
   Mode A).
Exit: Step 1G End State 1 (dispatch confirmed) — though the underlying
   emergency isn't "resolved" yet, the conversation's job (getting
   help dispatched) is complete.
```

**Inspection Slot Booking (Mode B — non-urgent):**
```
Trigger: Non-urgent, research-adjacent, or pre-emergency inquiry
   (Step 0A Emergency edge case — research-only customer) that still
   wants to schedule an inspection rather than immediate dispatch.
1. Collect preferred date/time and Tier 3 contact fields.
2. Book an inspection slot (standard appointment-style booking,
   calendar_event_id created) rather than triggering the urgent
   callback queue.
Exit: Step 1G End State 1.
```

**Emergency Escalation Path (Mode C):**
```
Trigger: Genuine life-safety hazard signal (Step 0A Emergency edge
   case — gas smell, sparking, structural collapse risk) — this
   supersedes all other logic per Step 0A, including whatever mode
   would otherwise apply.
1. Immediate safety guidance first, before any data collection (per
   Step 0A "what creates confidence" — reassurance about the next few
   minutes takes priority over routing mechanics).
2. Capture minimum Tier 3 fields (location + contact) in parallel with
   safety guidance, not sequentially after it.
3. Route to Human Handoff Handler, Priority 1 (Immediate).
Exit: Step 1G End State 5, with Priority 1 flag ensuring immediate
   human pickup per Module 1's Escalation Priority Classification.
```

---

##### ENGAGEMENT

Three distinct conversion types share the same mode structure, applied per type: **Donate**, **Volunteer**, **Attend**.

**Direct Registration (Mode A):**
```
Trigger: A direct registration/donation integration exists for the
   specific conversion type in question.
1. Confirm the specific contribution type and any relevant detail
   (donation amount/frequency, volunteer availability/skills, event
   selection) from Session Memory/handoff or collect fresh.
2. Action Permission Check (Step 1D.1): registration action-level
   permission granted for this specific type?
   NO → fall to Mode B.
3. Complete registration, collecting Tier 3 fields as part of
   completing it (mission-aligned framing per Step 0B: "I'll get you
   registered — what's the best email to send confirmation to?").
Exit: Step 1G End State 1.
```

**Guided to Form (Mode B):**
```
Trigger: No direct integration for this conversion type.
1. Provide a direct, specific link to the correct form/page for the
   exact conversion type discussed (not a generic "get involved"
   page).
Exit: Step 1G End State 2 unless the customer confirms in-session
   completion.
```

**Human Handoff (Mode C):**
```
Trigger: Neither direct integration nor a suitable form exists, OR
   the request doesn't cleanly fit donate/volunteer/attend (e.g., a
   partnership or major-gift inquiry).
1. Capture Tier 3 fields framed around the customer's specific
   interest.
2. Route to Human Handoff Handler, Priority 3 (Review) unless the
   inquiry itself signals urgency.
Exit: Step 1G End State 5.
```

---

#### 4. Data Collection at Conversion

All data collection in this module is Tier 3 (Commitment Capture, Step 0B Section on Tier 3) — contact info is collected as part of completing the transaction the customer has already decided on, never as a gate before it, and never re-requested if already present in the Growth Agent handoff payload's `captured_contact_fields` (Section 1 above).

| Archetype / Mode | Data Collected | Collection Step |
|---|---|---|
| Ecom Mode A | Item/variant, quantity, delivery details (if applicable) | Before cart creation; payment handled by checkout link, not the agent |
| Ecom Mode C | `customer_name`, `customer_email` or `customer_phone` | As part of handoff framing, per Step 0B Universal Prohibitions (never a bare form ask) |
| Restaurant Mode A | Party size, date, time, name | At reservation confirmation step |
| Restaurant Mode B (Waitlist) | Name, contact method | At waitlist entry |
| Appointment Mode A | `customer_name`, contact method, special requests (bundled) | At booking confirmation step |
| Appointment Mode B | `customer_name`, contact method, `preferred_date`, `preferred_time` | At request submission |
| Consultation Mode A (50–84) | `customer_name`, contact method (if not already from Growth Agent handoff) | At booking confirmation |
| Consultation Nurture (<50) | Contact method only (if not already held) | At nurture hand-off framing |
| Consultation Mode C (≥85) | Contact method (if not already held) | At priority-escalation framing |
| Emergency Mode A/C | Location, `customer_phone` (required — not optional even on refusal, see Step 0B Emergency edge case) | Immediately, in parallel with any safety guidance |
| Emergency Mode B | Contact method, `preferred_date`/`preferred_time` | At inspection slot booking |
| Engagement (all types) Mode A | Contact method, contribution-type-specific detail | At registration completion |
| Engagement Mode C | Contact method | At handoff framing |

**Universal rule for this module (restated from Step 0B):** No field is collected that isn't required for the specific transaction step in progress. No field already captured upstream (Growth Agent handoff, or earlier Tier 1/2 capture in the same conversation) is re-requested.

All fields in this table are subject to the Data Validation rules defined in Step 0B Section 7. The transition from DATA_COLLECTION to ACTION_PENDING (Module 3 Section 1.1 Conversion State Machine) is blocked until all required fields reach VALID or INVALID-FLAGGED state. No conversion action is submitted to a backend system with a NOT-YET-COLLECTED required field.

---

#### 4.1 Partial Conversion Handling

A conversion may be in progress before all required Tier 3 fields are collected. The agent tracks known vs. missing fields and continues from current state rather than restarting.

```
Known fields: already captured (from Growth Agent handoff
  captured_contact_fields, or from this conversation's Session
  Memory earlier turns).

Missing fields: still needed to complete the specific conversion
  mode's requirements.

Agent behavior: ask only for missing fields, one at a time, in
  the order the specific conversion flow requires them. Never
  re-ask for a known field.
```

**Example:**
```
Appointment booking:
  Known:  service = massage, date = Friday
  Missing: preferred_time
  Agent asks: "What time works best on Friday?"
  Not: "Let's start over with your booking details."
```

**State during partial collection:** DATA_COLLECTION → stays in DATA_COLLECTION until all required fields are known → then moves to ACTION_PENDING when the external system call fires.

**Rule:** Never restart a conversion because one field is missing. Advance from the current known state using what is already held.

---

#### 5. Failure Handling

Conversion Engine's actions call external systems (cart APIs, calendar systems, registration integrations) that can fail after the customer has already committed. This is treated as a first-class case, not an edge case, because the psychological cost of a failure here is highest — the customer believes the transaction is done.

**Universal reasoning requirement (applies to every case below):** Every
failure-handling response in this section includes a brief reason alongside
the fallback action — not just "here's what happens instead," but "here's
what happens instead, and here's why." This is already implicit in most of
the language below (e.g., "I wasn't able to add that directly — here's a
direct link"); this note makes it an explicit requirement for any future
failure case added to this section.

**Source:** Journal of Business Research, Vol. 180 (2024).

```
CART API ERROR (Ecom Mode A):
  Do not tell the customer "something went wrong" with no path
  forward. Immediately fall back to Mode B (guided link) for the same
  item, framed as: "I wasn't able to add that directly — here's a
  direct link so you can complete it that way." Log the failure
  internally; do not expose technical detail to the customer.

BOOKING CONFLICT AFTER COMMITMENT (Appointment / Restaurant / Emergency
Inspection Slot):
  If the slot becomes unavailable between confirmation-in-progress and
  actual calendar write (race condition), do not silently pick a
  different time. Return to Availability Conflict Handling
  (Appointment section above) and explicitly tell the customer what
  happened: "That slot was just taken — here's what's available
  instead." Never present an alternate time as if it were the
  originally requested one.

CALENDAR/REGISTRATION SYSTEM UNAVAILABLE (any archetype):
  If the underlying system (Google Calendar, registration API) is
  unreachable, do not retry indefinitely or leave the customer
  waiting silently. Fall to the archetype's Mode B or C (whichever is
  the correct manual/human fallback) after a single retry attempt,
  and be transparent that this is being handled by a person rather
  than implying a system confirmation that hasn't actually happened.

PAYMENT FAILURE (Ecom, post-checkout):
  This occurs after the agent's cart-creation step (payment is handled
  by the checkout link/page itself, per Mode A's flow), so it
  typically surfaces as the customer returning to the conversation
  reporting a failure rather than the agent detecting it directly.
  Treat as Intent 04 (Existing Customer Support) / Intent 06 if
  framed as wanting to cancel — route to Core Agent Support Handler
  (Step 3 Module 1 B), not back into Conversion Engine, since this is
  now a support matter, not a fresh conversion action.

EMERGENCY DISPATCH ACTION FAILS (job queue write fails, Mode A):
  This is the highest-severity failure case in the entire module —
  a failed dispatch during an active emergency cannot be treated like
  a failed cart write. Immediately route to Human Handoff Handler at
  Priority 1 (Immediate) rather than retrying or falling to Mode B,
  and tell the customer plainly that a person is being brought in
  directly: "I want to make sure this gets handled right now — I'm
  connecting you with someone directly."
```

**Universal failure rule:** Never confirm a transaction that has not actually completed on the backing system. A confirmed-sounding message describing an uncompleted action is worse than an honest "let me get this sorted another way" — this directly extends the Step 0A "what creates confidence" / "what causes disengagement" psychology into system-failure scenarios, where the stakes are higher precisely because the customer already believes they're done.

**Related:** These failure-handling cases follow the same Fallback
Pattern vocabulary (A/B/C/D) used system-wide — see
`06_Infrastructure/Fallback_Pattern_Catalog.md`.

---

#### 5.1 Conversion Abandonment Detection

This section defines when a customer's silence during a conversion constitutes abandonment eligible for Recovery Engine evaluation, vs. a completed or cancelled action that should not trigger recovery.

**State at abandonment → Recovery eligibility:**
```
INTENT_CONFIRMED + customer stops responding:
  → Recovery Engine eligibility check (if active).
  → Minimum: Soft Lead Record exists (Step 0B 4.1).

DATA_COLLECTION + customer stops responding mid-collection:
  → Recovery Engine eligibility check (if active).
  → Partial data held in record (whatever was collected before
    disengagement) — Recovery Engine uses this as context.

ACTION_PENDING + customer stops responding:
  → Do NOT treat as abandonment yet. System action is in flight.
  → Wait for external system result. If CONFIRMED → End State 1
    (Successful Completion, even without customer acknowledgment).
    If FAILED → proceed per Failure Handling (Section 5) rules.

CONFIRMED + customer stops responding:
  → Not abandonment. Conversion is complete.
  → Future contact from this customer is Existing Customer Support
    (Intent 04), not a recovery case.

CANCELLED (explicit) + customer stops responding:
  → Not abandonment. Deliberate cancellation is CANCELLED state.
  → Do NOT create recovery record. Respect the stated decision.
```

**Special case — Consultation Nurture Path (<50 score):** The nurture message implies follow-up ("someone will follow up with you directly"). If Recovery Engine is OFF AND no human handoff is configured, agent must not make this implication — use instead: "I'd recommend connecting with our team when you're ready — here's how to reach us." Never promise automated follow-up that has no mechanism.

**Rule:** Recover incomplete decisions. Do not recover completed actions. Do not recover explicit cancellations.

#### 5.2 Conversion Event Tracking

Conversion Engine records key events for analytics, dashboard population, and operational visibility. Not customer-facing.

```
conversion_started:     timestamp when INTENT_CONFIRMED state entered
conversion_type:        booking / cart / reservation / registration /
                        callback_dispatch / lead_handoff
conversion_mode:        A / B / C (per archetype)
source_module:          growth_agent / direct (no handoff payload)
required_fields_status: all_collected / partial / none
external_action_status: success / failed_recoverable / failed_escalation / not_attempted
failure_reason:         [if applicable — API error type, system unavailable, etc.]
final_state:            CONFIRMED / FAILED_RECOVERABLE / FAILED_ESCALATION / CANCELLED
recovery_eligible:      true / false (per Section 5.1 rules above)
```

**Planned fields for Integration Contract v2:** `conversion_state`, `conversion_mode`, `source_module`, `external_action_status`, `failure_reason`, `recovery_eligible`.

---

#### 6. Edge Cases

```
EC-01: Customer arrives at Conversion Engine directly (Intent 03 on
       the very first message) with no Growth Agent handoff payload
       at all.
       Handling: Per Section 1, proceed from a clean state — collect
       whatever the specific mode's flow requires from scratch. Do not
       treat the absence of a handoff payload as an error condition.

EC-02: Customer's Growth Agent handoff includes a selected_solution
       that is no longer available by the time Conversion Engine
       executes (e.g., stock sold out between Modules 2 and 3 in a
       fast-moving conversation).
       Handling: Treat as equivalent to Module 2's No Suitable
       Recommendation Handling (B.1) triggered mid-conversion — do not
       silently substitute a different item; disclose the change and
       offer the closest available alternative or route back to
       Growth Agent if a real re-recommendation is needed.

EC-03: Consultation customer's score is exactly at a tier boundary
       (score = 50 or score = 85) and the customer is actively engaged
       mid-conversation when scoring completes.
       Handling: Boundary scores round into the higher tier (score 50
       → Mode A applies, not nurture; score 85 → Mode C applies, not
       standard Mode A booking) — ties resolve toward the
       higher-attention path, never the lower one, since under-serving
       a borderline high-value lead is the costlier error.

EC-04: Restaurant party size is exactly at the escalation threshold
       (party size = 10).
       Handling: Per Section 3, "≥10" is inclusive — a party of
       exactly 10 routes to Mode C (Event/Catering Handoff), not Mode
       A.

EC-05: Customer provides Tier 3 data that fails basic validation
       (e.g., malformed email) during a conversion flow, not during
       Growth Agent's earlier tiers.
       Handling: Apply the same correction rule defined in Step 0B
       Edge Cases ("Customer gives email in wrong format") — flag
       once, plainly, ask for correction, do not proceed with invalid
       data and do not interrogate.

EC-06: Emergency Mode A (callback queue) is triggered, but the
       customer becomes unreachable (no response) before the 15-minute
       callback occurs.
       Handling: This is now a Step 1G End State 4 (Customer
       Disengaged) evaluation on top of an already-created dispatch
       record — the dispatch record itself is not cancelled (the
       underlying emergency may still be real), but the runtime
       flags the disengagement for whatever operational process
       handles unreachable dispatch cases; this is outside Conversion
       Engine's own action-level permissions to resolve further.

EC-07: Customer tries to modify a just-completed conversion within the
       same conversation (e.g., "actually, can you change the time?"
       immediately after a confirmed booking).
       Handling: This is Intent 04 (Existing Customer Support), not a
       continuation of Conversion Engine's flow — re-classify per Step
       1E and route to Core Agent Support Handler, which reads current
       Business Memory (the just-created booking) as the record to
       modify. Conversion Engine does not handle its own modifications
       after the exit condition has fired.
```

---

## STEP 3 MODULE 3 COMPLETION SUMMARY

- **Sub-flows / archetype coverage completed:** Commerce Ecommerce (Modes A/B/C) / Commerce Restaurant (Reservation, Waitlist, Event Handoff) / Appointment (Direct Booking, Request Booking, Availability Conflict Handling) / Consultation (Score Gate Logic, Score Tier Routing across all three tiers) / Emergency (Callback Queue, Inspection Slot, Emergency Escalation) / Engagement (Direct Registration, Guided to Form, Human Handoff — applied across Donate/Volunteer/Attend)
- **Decisions made:**
  - Treated Consultation's Mode A/B choice as a single deployment-level config flag (`consultation_scoring_enabled`) rather than a per-conversation choice, with Mode C defined as an automatic in-flight escalation rather than a separate standing mode — this matches the Execution Plan's framing of C as "score ≥ 85" rather than a client-selectable option.
  - Treated Emergency's Mode A/B split as runtime-determined by urgency classification (Step 0A) rather than static config, since the Execution Plan's own language ("callback queue" vs. "inspection slot booking") maps directly to the active-vs-non-urgent distinction already established in Step 0A's Emergency psychology, not to a client preference.
  - Added a dedicated Section 5 (Failure Handling) beyond the original Prompt_Steps_0A_to_6.md structure, per this session's explicit instruction that failure handling is critical — each failure case ties back to Step 0A's confidence/disengagement psychology and Step 1D.1 permission checks rather than being treated as generic error-handling boilerplate.
  - Resolved tie-breaking at Consultation's exact score boundaries (50, 85) toward the higher-attention tier, and Restaurant's exact-10 party size toward escalation — both decided in the direction of "when in doubt, treat the higher-stakes case as the higher-stakes case," consistent with the module's overall risk posture (Step 2 Section 2.2 Risk-Based Freedom Reduction applies the same directional bias elsewhere in the document).
- **Open questions:**
  - Consultation's lead-scoring mechanism itself (how the 0–100 score is calculated) is explicitly out of scope for this runtime document per Section 3's stated precondition — architect should confirm this is intentionally deferred to a separate scoring specification rather than needing definition here.
    - **Resolved (Q1):** Consultation scoring mechanism intentionally out of scope for Runtime System. Conversion Engine consumes `score_received` only. Separate Lead Scoring Engine Specification to be created later.
  - EC-06 (Emergency dispatch record with unreachable customer) references an unspecified "operational process" for unreachable dispatch cases — this is flagged rather than resolved, since it may belong to Module 4 (Recovery Engine) or to an entirely separate operational escalation path not yet covered anywhere in this document.
    - **Resolved (Q2):** Emergency unreachable customer (EC-06) is an operational exception, not a recovery case. Does not belong to Recovery Engine. Flagged for future Operational Exception Handler specification.
  - The Integration Contract's Demo Phase Rules state "Availability Check: Not Required" for the current sprint (agent asks date/time, then creates event without checking conflicts first) — this module's Direct Booking and Reservation flows are written assuming availability IS checked (per Production Upgrade Notes' future FreeBusy/Calendly integration), which may be ahead of what Demo Phase actually supports. Architect should confirm whether Demo Phase builders should implement a simplified version of these flows without the availability-check step.
    - **Resolved (Q3):** Runtime System defines final enterprise behavior. Demo vs Production differences handled via Implementation Capability Matrix (to be created separately), not by downgrading Runtime System spec.
  - Consultation Nurture Path follow-up promise conditional added in Section 5.1 — if Recovery Engine OFF and no human handoff configured, agent must not imply automated follow-up.
- **Additions applied:** Conversion State Machine (1.1) / Duplicate Action Protection (1.2) / Partial Conversion Handling (4.1) / Conversion Abandonment Detection (5.1) / Conversion Event Tracking (5.2)
- **Enterprise Expansion Flags** (per Architecture Expansion Rule — not yet in scope, noted for future expansion, not for current MVP decision-making):
  - **Full booking lifecycle:** The Conversion State Machine (1.1) and archetype flows currently cover Created → Confirmed (and failure branches) only. Enterprise booking/appointment/reservation records need the full lifecycle: Created → Confirmed → Reminder Sent → Reschedule Requested → Cancelled → No-Show → Reactivation. Reminders, reschedules, and no-show handling are not yet defined anywhere in this module (no-show specifically touches Step 0A Appointment psychology and would need its own tone rules, distinct from a fresh booking).
  - **Partial checkout with context-aware recovery messaging:** Section 5.1 (Conversion Abandonment Detection) currently flags abandonment generically by state. It does not yet differentiate recovery message content by exactly how far the customer got (e.g., "you were almost done — just the payment step remaining" for a DATA_COLLECTION-complete/ACTION_PENDING-failed case, vs. a generic "still interested?" for an INTENT_CONFIRMED-only case) — this is a Module 4 Recovery Engine message-logic concern once this module hands off the state detail.
  - **Payment method fallback:** Failure Handling (Section 5) currently routes payment failure straight to Core Agent Support Handler. Enterprise flow should offer an alternative payment method first, before treating it as a support case — this distinction (retry-with-alternative vs. genuine support issue) isn't yet defined.
  - **Inventory change between recommendation and conversion:** Partially covered by EC-02 (Growth Agent handoff references an item no longer available), but this needs fuller treatment as a first-class case — including inventory changes that occur *during* Conversion Engine's own DATA_COLLECTION state, not just before handoff.
- **Batch 2 Phase 3 amendments applied (Part A):** Section 5 (Failure Handling) now includes a Universal reasoning requirement (P1, Journal of Business Research Vol. 180, 2024) as a preamble before the specific failure-case list — every failure response must pair its fallback action with a brief reason, applying to all current cases and any future case added to this section.
- **Batch 3 Round 3 (Business Logic Hardening) applied:**
  - **Universal Mode Naming** (Patch 5, Part 1), inserted immediately before Section 2's Conversion Modes Table — clarification only, naming Mode A/B/C consistently across archetypes (Agentic Completion / Assisted Capture-or-Guided External Completion / Human Handoff). The table itself was not altered.
  - **Section 2.1 — Universal Availability Validation Layer** (Patch 5, Part 3), inserted between Section 2 and Section 3. Mostly names checks that already exist per-archetype, except the genuinely new Emergency team-availability check.
  - **Guided Self-Service Booking** (Patch 5, Part 2), inserted as a new Mode B alternate sub-type immediately after Appointment's existing Request Booking Flow, gated behind new config flag `appointment_selfservice_link_enabled`. The existing Request Booking Flow was not modified — this is an additive sibling, not a replacement.
  - **New Step 2.5 — Team Availability Check** (Patch 5, Part 3 addition), inserted into Emergency's Callback Queue Flow (Mode A) between existing steps 2 and 3. This is explicitly distinct from and additional to the existing Flag 2 "human available to receive callback" check (Step 4 Emergency Section 8) — both checks remain, neither was merged into or replaced the other.
- **Ready for architect review:** YES

---

### MODULE 4 — Recovery Engine (Active if purchased)

**Purpose:** Recover lost opportunities after a conversation ends without conversion. This is not a chasing system — it is a helpful continuation system. Done well, a recovery message feels like a natural, well-timed reminder from someone who remembered you, not pursuit from a system that won't let go. The customer's actual state always matters more than the cadence timer: every scheduled step re-checks whether the customer has already converted, escalated, or opted out before sending anything, and different archetypes go cold at meaningfully different speeds — an Emergency lead is unreachable within hours; a Consultation lead can stay warm for a month. This module respects those differences rather than applying one universal timer.

#### 1. Purpose, Scope & Activation

**What this module does:** Creates a recovery record at the precise moment a conversation ends with an incomplete decision (per the eligibility rules in Step 3 Module 3 Section 5.1), runs a multi-step, archetype-specific cadence of follow-up messages, and halts immediately and permanently the moment the customer converts, escalates, or opts out.

**What this module does not do:** It does not run for conversations that ended in a completed action (Step 1G End State 1) or an explicit cancellation (Module 3's CANCELLED state). It does not pressure, does not increase urgency across steps to manufacture pressure, and does not send a message once a stop condition has fired — even if that message was already scheduled.

**Activation:** Evaluated at Step 1G End State 2 (Open Opportunity) and End State 4 (Customer Disengaged, meaningful-intent branch), per Step 1G's own check ("Recovery Engine active? YES → create recovery record"), and referenced by Module 2's Internal Conversation Recovery Flow (D) and Module 3's Conversion Abandonment Detection (5.1) at the exact points where each module asks "Recovery Engine active?"

**Fallback if OFF:** The system ends gracefully at Step 1G End State 2 or End State 4. No recovery record is created. No follow-up of any kind occurs. This is not a degraded version of the module — it is the fully correct behavior for a deployment that hasn't purchased this capability. Per Step 0B Section 4.1, a Soft Lead Record may still exist from Tier 2 capture, but nothing acts on it.

---

#### 2. Recovery Trigger Definition

A recovery record is created at the exact moment a conversation ends without conversion — never earlier, and never as a background process running in parallel with an active conversation.

```
RECOVERY TRIGGER CONDITIONS (exact moment, per archetype):

Commerce (Ecom):     Conversation ends after a recommendation/cart
                      action, no purchase confirmed.
                      OR: Cart link sent (Module 3 Ecom Mode A/B), no
                      purchase confirmation received.
Commerce (Restaurant): Conversation ends after availability discussion
                      or waitlist entry, no reservation confirmed.
Appointment:          Conversation ends after availability discussion,
                      no booking confirmed.
                      OR: Date/time collected (Module 3 DATA_COLLECTION
                      state reached), no confirmation completed.
Emergency:            Callback requested (Module 3 Mode A,
                      ACTION_PENDING) but not confirmed reached within
                      the callback window.
Consultation:         Discovery complete, score returned, no booking
                      made — including the <50 nurture path (Module 3
                      Score Tier Routing) where no self-service booking
                      was ever offered.
Engagement:           Program/contribution type matched, no
                      registration completed.
```

**Non-trigger conditions (no recovery record created, regardless of archetype):**
```
- Customer explicitly says "not interested" or otherwise declines
  outright (Module 2 Recommendation Flow "declines outright" exit,
  Step 1G End State 1 close — not an open opportunity).
- Conversation ended by escalation to a human (Step 1G End State 5) —
  per that state's own rule, AI does not create a recovery record
  while human owns the conversation.
- Customer already converted in the same session (Step 1G End State 1)
  — even if a different, earlier interest in the same conversation
  went unresolved (e.g., customer asked about two products, bought
  one) — see Edge Cases for the partial-conversion case.
- Customer is an existing customer in support mode (Step 3 Module 1 B)
  with no separate sales opportunity opened via the Support →
  Opportunity Detection bridge (Module 1 B.1).
- Conversation ended via explicit customer cancellation (Module 3
  CANCELLED state, Section 5.1) — a deliberate "no" is respected, not
  treated as an open opportunity.
```

This trigger table is the runtime expression of Step 3 Module 3 Section 5.1's state-eligibility table — Section 5.1 defines *which conversion states* are recovery-eligible in the abstract; this section defines the *exact archetype-specific moment* that eligibility becomes a created record.

---

#### 3. Recovery Profiles

Cadences below are grounded in the existing n8n Recovery Engine Build Guide (WF-101–WF-104, `06_Infrastructure/n8n/`) so this runtime specification matches what is already built, not a new invented schedule.

| Profile | Cadence (steps) | Max Steps | Goal | Channel (Demo / Production) |
|---|---|---|---|---|
| **Emergency** | 15 min → 6 hr → 24 hr | 3 | Recover a missed emergency lead within the highest-urgency window — first 24 hours are critical, per Step 0A Emergency's Short Patience Window carried forward into recovery timing. | Demo: Email + Slack log. Production: Convocore → WhatsApp/SMS/Email per client channel preference. |
| **Appointment** | 1 hr → 24 hr → 3 days → 7 days | 4 | Recover a discussed-but-unbooked slot while the need is still live, tapering as the specific date discussed becomes less relevant. | Demo: Email + Slack log. Production: Convocore → WhatsApp/SMS/Email. |
| **Commerce (Ecom)** | 30 min → 24 hr → 72 hr | 3 | Recover cart/recommendation interest while purchase intent is fresh — short window reflecting Step 0A Commerce's Short→Medium Patience Window. | Demo: Email + Slack log. Production: Convocore → WhatsApp/SMS/Email. |
| **Commerce (Restaurant)** | 1 hr → 24 hr | 2 | Recover an unconfirmed reservation quickly — restaurant timing is date-specific and goes stale fast. | Demo: Email + Slack log. Production: Convocore → WhatsApp/SMS/Email. |
| **Consultation** | 1 day → 3 days → 7 days → 14 days → 30 days | 5 | Recover a qualified-but-unbooked lead over a genuinely long window, reflecting Step 0A Consultation's Long Patience Window and the reality that B2B/high-consideration decisions take weeks, not hours. Score-aware — see Section 4. | Demo: Email + Slack log. Production: Convocore → WhatsApp/SMS/Email. |
| **Engagement** | 1 day → 7 days → 21 days — approved. Reflects Step 0A Engagement's Long Patience Window and mission-driven (not urgency-driven) timing — slower than Commerce, but without Consultation's score-based branching since Engagement has no lead-scoring mechanism. Future workflow: WF-105 (Engagement Recovery Engine — to be built; no corresponding n8n workflow exists yet). | 3 | Keep the door open for a values-aligned supporter without pressure — the goal is closer to "stay visible" than "close." | Demo: Email + Slack log (matching existing pattern). Production: Convocore → WhatsApp/SMS/Email. |

**Universal cadence rule (from the n8n implementation, restated as a runtime requirement):** Every scheduled step re-reads the current Lead Status live, immediately before sending — not just at record creation. If Lead Status is Converted, Escalated, or Closed at send time, the message does not go out, regardless of how long ago the record was created or how many steps remain. This is the runtime expression of "the customer's state matters more than the cadence timer."

---

#### 3.1 Time-of-Day and Business Hours Suppression

A recovery message that arrives at 3am is worse than no message. Before sending any recovery step, the runtime checks whether the current time falls within an appropriate send window.

**Send window rules:**
```
Default send window: 8:00 AM – 8:00 PM customer's local time.
  Timezone: Derived from location data collected at conversion
  (city/region), or from channel metadata. If unknown, defer to
  business's configured timezone.

Emergency archetype exception:
  First step (15-minute) only — bypass time window entirely.
  A genuine emergency recovery message at any hour is appropriate.
  Steps 2+ (6-hour, 24-hour) follow standard suppression.

Scheduled step arrives outside send window:
  Do not send. Do not skip the step. Hold it and send at the
  next opening of the send window (8:00 AM next day if the step
  fired overnight). Do not compress the cadence to make up for
  the hold — the gap between steps remains based on the original
  schedule, not the actual send time.

Transactional outbound (Email Manager, confirmations, reminders):
  Also subject to time-of-day suppression except for:
  - Immediate appointment/booking confirmations (always send on
    confirmation, regardless of time — customer just completed
    an action and expects immediate confirmation)
  - Emergency dispatch confirmations (same exception as above)
```

**Business-hours config field (added to Appendix A):** `send_window_start` and `send_window_end` (configurable per client, default 08:00–20:00 local time).

---

#### 4. Recovery Message Logic

**How message content is determined at each step:**
```
NON-SCORED ARCHETYPES (Emergency, Appointment, Commerce, Engagement):
  Message content is determined by cadence STEP number alone — each
  step has a fixed message template appropriate to how much time has
  passed (e.g., Emergency Step 1 at 15 minutes reads as an immediate
  check-in; Consultation-style urgency framing would be wrong here).

CONSULTATION (score-aware):
  Message content is determined by LEAD SCORE TIER, independent of
  cadence step — a score ≥85 lead gets the "Priority" message whether
  it's Step 1 or Step 3. The cadence STEP only controls timing (when
  the next message goes out), not what it says. Score tiers:
    Score ≥ 85:  Priority message — immediate urgency framing, senior
                 consultant availability offered.
    Score 70–84: High Intent message — opportunity framing, discovery
                 call offered.
    Score 50–69: Qualified message — consultation-value framing.
    Score < 50:  Low Intent message — general nurture, resource-sharing
                 framing, no call pushed.
  Score ≥ 70 leads also re-trigger a sales-team internal alert
  (per Integration Contract-adjacent workflow WF-302) on every
  recovery step, not just at initial scoring — ensuring a
  high-value lead's recovery attempts stay visible to a human, even
  though the recovery message itself is still agent-authored.
```

**What the agent references from the prior conversation:** The `conversation_summary` field and any `selected_solution`/preference held in the Soft or Conversion-adjacent Lead Record (per Step 0B Section 4.1 and Module 2's handoff payload) — enough to make the message feel specific and continuous, never generic. Per Step 0C Section 4 (Privacy Boundaries), the message never references frequency/count data ("you've asked about this 3 times") or any tracking-style detail — it references *what was discussed*, not *how the system observed the customer*.

**Tone rules per archetype:**
```
Emergency:     Direct, calm, service-oriented — "we want to make sure
               you get help" rather than a generic marketing tone.
               Never guilt-inducing about the missed window.
Appointment:   Warm, low-pressure — an invitation to pick back up, not
               a reminder that they "still haven't booked."
Commerce:      Helpful, specific to the item/cart — never discount-
               baiting unless a discount action is separately
               authorized (Step 1D.1); recovery is not a backdoor
               around Objection Handling's no-discount-authority rule.
Consultation:  Consultative and tier-appropriate per Section 4 above —
               never salesy at the Low Intent tier, never falsely
               urgent at tiers below 85.
Engagement:    Mission-aligned, patient — "when the timing is right,
               we're here" framing rather than a conversion push,
               consistent with Step 0A Engagement psychology's low
               Transaction/high Relationship weighting even in
               recovery.
```

**First-touch tone calibration (addition):** Step 1 of any recovery cadence
defaults to light/informational tone rather than urgency framing. A
majority of abandonment reflects genuine non-purchase intent, not lost
revenue (Baymard Institute research — most abandonment is "just browsing,
not ready"). Reserve any urgency framing (per B1's truthful-consequence
standard) for later cadence steps only, and only if a genuine constraint
exists.

**Source:** Baymard Institute meta-analysis, 50 studies.

---

#### 5. Customer Suppression Rules

Independent of cadence timing, the following conditions stop recovery immediately and permanently — checked before every scheduled send, not just at record creation:

```
IMMEDIATE, PERMANENT SUPPRESSION TRIGGERS:
1. Customer explicitly opts out of follow-up in any channel
   ("stop contacting me," "unsubscribe," "please don't email me
   again") — honored instantly, regardless of which step the
   cadence is on.
2. Customer converts through any channel, including one outside this
   conversation (e.g., calls the business directly) — Lead Status
   updates to Converted, the universal Stop Condition Check (Section
   6) catches this on the next scheduled send.
3. Customer escalates or a complaint is raised in a later, unrelated
   conversation — Lead Status updates to Escalated; recovery halts
   even though the escalation may be about something else entirely,
   since continuing to send recovery messages to someone with an open
   escalation is tone-deaf regardless of topic.
4. Business manually closes the lead (Lead Status = Closed) — e.g., a
   staff member determines the lead is no longer viable for a reason
   the runtime doesn't have visibility into.
5. Email Service Provider spam-complaint received
   (email_bounce_status = Spam-Complaint, per Module 5 email
   lifecycle fields, Appendix A):
   Immediate, permanent suppression — equivalent to opt-out.
   Rule: A spam complaint is the strongest possible signal that
   the customer does not want this contact. It overrides any
   remaining cadence steps and sets suppression flag at customer
   record level (same permanent suppression as item 1 opt-out),
   so future recovery records for this customer do not reactivate
   email as a channel without explicit re-permission.
   Channel consequence: Spam-complaint suppresses EMAIL channel
   specifically. If other channels (WhatsApp, SMS) are configured
   and the customer has not opted out from those, Recovery Engine
   may continue through those channels — the suppression is
   channel-specific, not a global stop, unless the customer also
   opts out verbally/explicitly from other channels.
```

**PRE-RECORD OPT-OUT HANDLING:** An opt-out or "don't contact me" statement can occur before any Lead or Recovery record exists yet for this customer (e.g., during Tier 1 passive capture, before any conversion attempt). This preference must still be honored permanently, not only once a formal record exists.

**Mechanism:** The moment a contact method (email/phone) is captured alongside an explicit opt-out statement, create a minimal suppression-only record keyed to that contact method — even in the absence of a Lead/Recovery record. Any future Lead or Recovery record creation for a matching contact method (Step 0C Section 4.1 identity matching) checks this suppression record first and inherits the opt-out immediately, rather than starting fresh as if the preference was never stated.

**Rule:** Suppression is permanent for that record — a suppressed recovery record does not resume later even if circumstances change. If the customer re-engages independently, that is a new conversation evaluated fresh through Step 1A Session State Check, not a resumed recovery cadence.

---

#### 6. Stop Condition Enforcement

```
STOP CONDITION: CUSTOMER CONVERTS
  Detection: Lead Status = Converted, checked live at every scheduled
             send (per Section 3's Universal cadence rule).
  Record outcome: Recovery Status → Completed. No further messages.
  This check is non-negotiable — a converted lead must never receive
  a recovery message, regardless of timing.

STOP CONDITION: CUSTOMER EXPLICITLY OPTS OUT
  Detection: Suppression trigger fires (Section 5, item 1).
  Record outcome: Recovery Status → Stopped. Suppression flag set
  permanently on the customer record (Step 0C Level 2), so future
  recovery-eligible conversations for this customer do not create new
  recovery records either — the opt-out is a customer-level
  preference, not a single-record pause.

STOP CONDITION: CUSTOMER ESCALATES
  Detection: Lead Status = Escalated.
  Record outcome: Recovery Status → Paused. Consistent with Step 1G
  End State 5's rule that AI does not create/continue a recovery
  record while a human owns the conversation — paused rather than
  stopped because ownership may return to AI later (Step 3 Module 1 D,
  Case 1 and Case 3), at which point recovery eligibility is
  re-evaluated rather than permanently closed.
```

**PAUSED-STATE RESUMPTION**

A Recovery record enters Paused when a human takes ownership (Section 7.1 Recovery Ownership Rule) or when an active live conversation is in progress.

```
Resumption triggers (whichever occurs first):
  A) Customer replies to a recovery message → per Section 6.1
     (already defined — starts new conversation).
  B) Human explicitly closes/resolves their task without a
     customer reply → system sets human_ownership_flag = false
     for this record → Recovery Engine checks the record on its
     next scheduled cadence cycle:
       IF max steps not yet reached AND customer not Converted/
       Stopped/Completed → Resume from the next scheduled step.
       IF max steps reached during pause → status = Stopped.
  C) Active live conversation ends without conversion → re-evaluate
     per Module 3 Section 5.1 abandonment rules → if recovery-
     eligible, resume or create new record per standard eligibility.
```

**Rule:** A Paused record must have at least one defined resumption path. A record that can be paused but never unpaused is a data quality bug, not a valid lifecycle state.

```
STOP CONDITION: MAX STEPS REACHED
  Detection: Current step exceeds the archetype's max steps (Section
  3 table) with no conversion, no opt-out, no escalation.
  Record outcome: Recovery Status → Stopped.
```

**Recovery Status Rule:** The system never labels a customer as "Failed." A recovery attempt can expire. The customer did not fail.

```
Status mapping:
  Converted        → Completed
  Opted out        → Stopped
  Escalated        → Paused
  Max steps reached → Stopped
```

---

#### 6.1 Recovery Reply Handling

When a customer responds to any recovery message:

```
1. Stop the scheduled recovery cadence immediately. Do not send
   any further scheduled steps regardless of cadence position.

2. Load context:
   - original conversation_summary
   - recovery_context (what was discussed, what stage cadence was at)
   - latest Business Memory (current config, current availability)
   Not cached state from when the recovery record was created.

3. Re-enter Universal Runtime Layer (Step 1) as a new session.
   Apply Step 1A Session State Check — this customer is a
   Returning Lead (prior conversation exists, no conversion).

4. Classify the new message intent normally per Step 1B.
   Examples:
     "Yes let's book" → Intent 03 → Conversion Engine
     "I have a question first" → Intent 01/02 → Growth/Core
     "Stop messaging me" → Suppression trigger (Section 5)
     "What was I looking at?" → Intent 10 (Returning With Context)
```

**Rule:** A recovery reply starts a new conversation. It does not continue the recovery sequence. The cadence is replaced by the live conversation from this point.

---

#### 7. Edge Cases

```
EC-01: Customer converts through a channel this system has no
       visibility into (e.g., walks into the physical business).
       Handling: Recovery continues sending scheduled messages until
       Lead Status is manually updated to Converted by staff — this is
       an operational/data-entry gap, not a runtime logic gap. The
       runtime cannot suppress what it has no signal for; flagged as
       a business-process dependency, not fixed by this module alone.

EC-02: Customer had two separate interests in one conversation (e.g.,
       asked about two products), converted on one, left the other
       unresolved.
       Handling: Per the Non-Trigger Conditions, "customer already
       converted in the same session" is a non-trigger — but this
       applies to the conversation as a whole reaching Step 1G End
       State 1, not to each individual sub-interest. The unresolved
       second interest does not spawn its own recovery record; the
       conversation's overall successful outcome takes priority,
       consistent with Step 1E's context-preservation rule treating
       the secondary interest as something the customer can raise
       again, not something the system chases independently.

EC-03: Consultation lead's score changes between recovery steps (e.g.,
       new information updates the score from 65 to 78 partway through
       the 5-step cadence).
       Handling: Per Section 4, message content is re-evaluated by
       current score at each send, not fixed at record-creation time —
       the lead receives whatever tier message matches its score at
       the moment each step fires, and crossing the 70 threshold
       triggers the sales-team re-alert from that point forward even
       if earlier steps didn't.

EC-04: Recovery record's cadence step arrives, but the business's
       config has changed since the conversation ended (e.g., a
       product referenced in the message is now discontinued).
       Handling: Per Step 0C Level 3 priority, Business Memory always
       overrides stale context — the recovery message must not
       reference the now-discontinued item as if it's still available;
       if the message template can't be dynamically corrected, the
       safer fallback is a softer, less specific message ("wanted to
       follow up on what we discussed — still exploring options?")
       rather than sending outdated specifics.

EC-05: Engagement recovery fires (using the approved cadence from
       Section 3, no corresponding n8n workflow built yet) for a
       passive supporter who was
       explicitly identified in Step 0A as someone who should be
       nurtured, not pushed toward conversion.
       Handling: Per Step 0A Engagement psychology and this module's
       tone rules (Section 4), the recovery message itself must
       already read as low-pressure/mission-aligned — a passive
       supporter receiving a recovery message should not be able to
       tell the difference between "genuine follow-up" and "system
       trying again," which is the core design principle this entire
       module is built around.

EC-06: Two recovery-eligible moments occur in sequence for the same
       customer before the first cadence completes (e.g., an
       Appointment customer has an unbooked recovery record active,
       then starts a new conversation that also ends without
       conversion).
       Handling: Do not create a second, parallel recovery record for
       the same customer/profile combination — this mirrors Module
       3's Duplicate Action Protection (1.2) principle applied to
       recovery records rather than conversion actions. The existing
       active record's cadence continues; the new conversation's
       context may update the existing record's reference content
       (Section 4) rather than spawning a competing cadence.
```

---

#### 7.1 Recovery Ownership Rule

Only one actor owns follow-up on a customer at any time.

**Priority order:**
```
PRIORITY 1: Human agent with active ownership
  If a human follow-up task exists for this customer/record,
  Recovery Engine pauses automatically — does not send while
  human ownership flag is set.

PRIORITY 2: Active live conversation
  If the customer starts a new live conversation, Recovery Engine
  pauses for that session. If the conversation ends without
  conversion again, recovery eligibility is recalculated from
  the current conversation state — not resumed blindly from the
  old cadence position.

PRIORITY 3: Recovery Engine
  Default owner when no human task and no active conversation.
```

This prevents simultaneous contact by AI and a human team member — a collision that destroys the experience regardless of message quality.

---

#### 8. Enterprise Recovery Scope Expansion

The Module 4 definition above (Sections 1–7.1) covers agent-conversation abandonment — a customer who talked to Zenny and didn't convert. Enterprise-grade recovery must also cover opportunities that originate outside any AI conversation entirely. Per the Architecture Expansion Rule, this expansion is not gated by what current infrastructure (n8n/Airtable) already implements — it defines the full enterprise model; MVP scoping is a separate decision.

**Recovery Engine Inputs — Full Enterprise Model:**

```
SOURCE A: AI Conversation Abandonment (currently defined above)
  Customer had a Zenny conversation, did not convert.

SOURCE B: Ecommerce Abandoned Cart (external platform)
  Customer added items to cart on the ecommerce platform
  (Shopify/WooCommerce/etc.) without ever talking to the agent.
  Trigger: Platform webhook → cart_abandoned event.
  Recovery context: cart contents, cart value, customer identity
  if logged in, time since abandonment.
  Psychology: Customer showed purchase intent at platform level —
  agent picks this up as a warm, product-specific lead even with
  no prior AI conversation.

SOURCE C: Checkout Abandonment
  Customer reached checkout (further than cart) but did not
  complete payment. Distinct from cart abandonment — higher
  intent, different recovery urgency.
  Trigger: Platform webhook → checkout_abandoned or
  payment_page_exited event.
  Recovery: More specific to completion friction ("almost done")
  rather than product discovery.

SOURCE D: Payment Failure Recovery
  Customer completed checkout intent but payment gateway failed.
  This is NOT a support case alone — it is a high-intent
  recovery case where the customer wanted to complete and
  something technical stopped them.
  Trigger: Payment gateway → payment_failed event.
  Recovery message: Specific to the failure ("your payment
  didn't go through — here's how to complete it") not generic.
  Distinguished from: Post-purchase payment dispute (which IS
  support/Core Agent, Module 1).

SOURCE E: Booking Platform Abandonment
  Customer started a booking flow on a booking platform
  (Calendly, Google, etc.) without completing it.
  Trigger: Booking platform webhook → booking_started_not_completed.
  Recovery context: service type, attempted date/time if captured.

SOURCE F: Form Abandonment
  Customer started a consultation/contact/registration form,
  did not submit.
  Trigger: Form platform → form_started_not_submitted.
  Minimum recovery context: form type, any fields completed
  before abandonment.

SOURCE G: Quote/Proposal Expiry (Consultation archetype)
  A human sent a proposal/quote that the lead has not responded
  to within a defined window.
  Trigger: CRM event → proposal_status = sent, no response
  after X days.
  Recovery: Consultative check-in, not a re-pitch.

SOURCE H: Customer Reactivation
  Previously converted customer has been inactive beyond an
  archetype-defined window (no repeat booking, no repeat
  purchase, no engagement activity).
  Trigger: CRM event → last_conversion_date > reactivation_threshold.
  This is NOT the same as abandonment — this is a relationship
  continuation play.
  Archetype-specific thresholds:
    Commerce (Ecom):      90 days since last purchase
    Appointment:          60 days since last booking
    Consultation:         6 months since last engagement
    Engagement:           30 days since last activity

SOURCE I: Platform Review/Feedback Trigger
  Customer left a review or completed a post-service survey
  indicating interest in returning.
  Trigger: Review platform → review_submitted (positive sentiment).
  Recovery: Warm re-engagement, not a cold outreach.
```

**Universal Intake Rule for all sources:** Regardless of source, every recovery opportunity normalizes into the same evaluation:

```
Opportunity detected
↓
Is this customer currently in a live conversation? → pause
Is this customer human-owned? → pause
Has this customer opted out? → suppress
Is Lead Status Converted/Closed? → do not recover
↓
Which archetype does this belong to?
↓
Which psychology state applies? (Step 0A)
↓
Which cadence profile? (Section 3)
↓
What context exists for message personalization? (Section 4)
↓
Which channel? (per config)
```

This is the same Recovery Ownership Rule (7.1) and Customer Suppression Rules (5) applied uniformly — Source B–I opportunities are not a separate recovery system, they are additional intake paths into the identical evaluation, cadence, message-logic, and stop-condition machinery already defined in Sections 1–7.

**Implementation note:** Sources B–I require external webhook/event integration into the recovery intake layer. This is an infrastructure concern (n8n workflows, Integration Contract v2), not a runtime behavior change — the runtime logic above applies identically regardless of which source created the recovery record.

**MVP compression decision (for architect, not runtime):** Which sources are in scope for v1 implementation vs. later phases? This document defines the full enterprise model; builders implement the approved subset.

---

## STEP 3 MODULE 4 COMPLETION SUMMARY

- **Sections completed:** 1. Purpose, Scope & Activation / 2. Recovery Trigger Definition / 3. Recovery Profiles / 4. Recovery Message Logic / 5. Customer Suppression Rules / 6. Stop Condition Enforcement / 6.1 Recovery Reply Handling / 7. Edge Cases / 7.1 Recovery Ownership Rule / 8. Enterprise Recovery Scope Expansion
- **Decisions made:**
  - Grounded all cadence timings in the existing n8n Recovery Engine Build Guide (`06_Infrastructure/n8n/15. n8n_Recovery_Engine_Build_Guide_v1.docx`, workflows WF-101–WF-104) as reference material, per the Architecture Expansion Rule — used as a starting point for what's already built, not as a ceiling on what this module defines.
  - Added Section 5 (Customer Suppression Rules) as a dedicated section beyond the original Prompt_Steps_0A_to_6.md structure, per this session's explicit instruction that suppression must be defined — the source n8n Build Guide defines the live Stop Condition Check (Converted/Escalated/Closed) but has no explicit customer-initiated opt-out mechanism, so this section fills a genuine gap rather than restating existing logic.
  - Positioned this module's trigger definitions (Section 2) as the archetype-specific runtime expression of Step 3 Module 3 Section 5.1's abstract state-eligibility rules, rather than redefining eligibility from scratch — keeping Module 3 as the single source of truth for *which conversion states* are recovery-eligible.
  - Section 8's nine-source enterprise intake model (Sources A–I) treats all non-conversation recovery origins as additional entry points into the identical Sections 1–7 machinery (same cadence profiles, same suppression rules, same ownership priority, same stop conditions) rather than as a parallel system — this keeps the module internally consistent even as its scope expands well beyond the original AI-conversation-only definition.
- **Open questions:**
  - EC-01 (conversion through an untracked channel) is identified as a business-process/data-entry dependency rather than a runtime logic gap — flagged for whoever owns staff-side CRM discipline, not something this document can resolve through agent behavior alone.
  - Section 8's archetype-specific reactivation thresholds (90 days Ecom / 60 days Appointment / 6 months Consultation / 30 days Engagement) are proposed, not validated against any existing business data — architect should confirm or adjust before these become build targets.
  - Section 8 Sources B–I each assume a specific external platform webhook/event shape (e.g., `cart_abandoned`, `payment_failed`) that has no corresponding definition yet in the Integration Contract — these are conceptual trigger names, not confirmed payload contracts, and will need formal specification whenever a given source is scoped into an implementation phase.
- **Changes applied this pass:** Recovery Status "Failed" eliminated — Converted → Completed, Opted out → Stopped, Escalated → Paused, Max steps reached → Stopped (resolves prior open question). Recovery Reply Handling (6.1) added — a reply to any recovery message halts the cadence and re-enters the Universal Runtime Layer as a new session, never continuing the cadence. Engagement cadence (1 day → 7 days → 21 days, 3 steps, future WF-105) confirmed as approved, no longer proposed. Recovery Ownership Rule (7.1) added — Human ownership > active live conversation > Recovery Engine, preventing simultaneous AI/human contact. Enterprise Recovery Scope Expansion (8) added — nine recovery-opportunity sources beyond AI-conversation abandonment (cart/checkout/payment/booking/form abandonment, proposal expiry, customer reactivation, review triggers), all normalized through the same intake evaluation.
- **Batch 2 Phase 3 amendments applied (Part B):** Section 4 (Recovery Message Logic) now includes a First-touch tone calibration note (P2/B5, Baymard Institute meta-analysis, 50 studies) after the Tone rules per archetype block — Step 1 of any cadence defaults to light/informational tone, urgency framing reserved for later steps only with a genuine confirmed constraint.
- **Ready for architect review:** YES

---

### MODULE 5 — Email Manager (Active if purchased)

**Purpose:** Email Manager is not "answer emails." It is an async employee intelligence layer — the same runtime intelligence that drives live conversation (Modules 1–4), applied to a channel where responses aren't expected in seconds and a single customer may have multiple concurrent, evolving threads. It categorizes, summarizes, drafts, and — within a strictly gated boundary — replies autonomously, while remaining the execution layer for outbound email triggered by every other module in this document.

Per the Architecture Expansion Rule, the existing n8n Email Manager Build Guide (`06_Infrastructure/n8n/14. n8n_Email_Manager_Build_Guide_v1.docx`, workflows WF-201–WF-205) and the Integration Contract's email fields are used as reference grounding for what's already built — not as the ceiling for what this module defines.

---

#### 1. Purpose, Scope & Activation

**What this module does:** Receives and normalizes inbound email, categorizes and summarizes every message, operates at one of three configured autonomy levels to determine how (or whether) it replies, and serves as the outbound delivery layer for email-based communication triggered by other modules (Recovery Engine, Conversion Engine, Core Agent, Consultation summaries).

**What this module does not do:** It does not make business decisions beyond its configured autonomy level — Level 1 never sends a reply under any circumstance; Level 2 never sends without human approval; Level 3 never bypasses the 5-condition gate. It does not act as a substitute for live-conversation intent classification (Step 1B) — email categorization (Section 5) is a related but distinct taxonomy suited to asynchronous, often multi-topic messages.

**Activation:** Per module purchase/config, independent of which other modules (Core/Growth/Conversion/Recovery) are active — Email Manager is genuinely standalone; a deployment could run Email Manager with no live-chat modules active at all (e.g., a business that only wants inbox triage).

**Fallback if OFF:** Inbound email receives no automated handling — it sits in the inbox for manual triage exactly as it would without this system. Other modules that would otherwise trigger an outbound email (Recovery Engine, appointment reminders) fall back to their own next-best channel per their own configuration (e.g., Recovery Engine's Production channel is Convocore → WhatsApp/SMS/Email "per client channel preference" — Email Manager being OFF simply removes Email from that preference set, it does not break Recovery Engine).

---

#### 2. Inbox Intelligence Model

##### 2.1 Inbound Email Categorization

The Integration Contract defines 8 approved categories (`Lead`, `Support`, `Complaint`, `Refund`, `Booking`, `General`, `Partnership`, `Proposal`) — broader than the 6 categories currently implemented in the n8n Build Guide (`Lead Inquiry`, `Support`, `Complaint`, `Refund`, `Partnership`, `General Inquiry`, which omits `Booking` and `Proposal`). This runtime document adopts the Integration Contract's fuller 8-category set as the baseline, and per the Architecture Expansion Rule, extends it further with categories a real business inbox receives that neither source document currently covers:

```
BASELINE (Integration Contract, 8 categories):
  Lead        — new prospective customer inquiry
  Support     — existing customer, service/product question
  Complaint   — dissatisfaction, always escalates (Section 4)
  Refund      — transaction reversal request, always escalates (Section 4)
  Booking     — appointment/reservation-related correspondence
  General     — catch-all, doesn't fit another category
  Partnership — business-to-business inquiry, vendor/collaboration
  Proposal    — a sent quote/proposal awaiting response (ties to
                Module 4 Source G, Quote/Proposal Expiry)

ENTERPRISE EXPANSION (beyond current scope in both source documents):
  Vendor/Supplier      — operational correspondence, not customer-facing
                          at all; routes to business operations, never
                          to customer-facing autonomy logic.
  Media/Press           — inquiries from journalists/media — always
                          escalates; never a categorization the agent
                          should self-serve regardless of confidence.
  Job Application        — recruiting-related; routes to HR/ops, not
                          customer service logic at all.
  Spam/Irrelevant         — no business relevance; archived, not
                          categorized into any customer-facing bucket.
  Internal/Misdirected — email addressed to the business's inbox but
                          intended for a different department/person;
                          routed for redirection, not answered as if
                          it were a customer inquiry.
  Automated/System Notification — inbound email from an automated sender
                          (platform notifications, ad-account alerts,
                          marketplace order notifications, subscription/
                          newsletter content the business itself
                          receives). Not from a customer. Never enters
                          reply logic at any autonomy level — filed/
                          organized only, same treatment as
                          Spam/Irrelevant, but tracked as a distinct
                          category since these are legitimate business
                          correspondence (e.g., a Meta ads billing
                          notification), just never reply-worthy.
                          Detection: automated-sender headers/patterns
                          (same detection mechanism already defined for
                          the EC-04 auto-reply-loop edge case in §8 — this
                          category formalizes that detection into a
                          named category rather than only an edge-case
                          handling note).
```

**Category extensibility:** The category list above (both customer-facing
and operational sets) is the default configuration, not a fixed universal
constant. A client's category set is Business-Config-loaded and may be
extended with additional categories specific to that business's inbox
patterns, following the same customer-facing/operational split and the
same routing rules per autonomy level. New category requests are an
operational/account-management process, not a runtime behavior — the
runtime simply reads whatever category set the current Business Config
defines.

**Routing per category, per autonomy level:** See Section 5's full table.

##### 2.2 Outbound Email Ownership

Not every outbound email is a "reply." This module distinguishes what it may *initiate* from what it may only *respond to*:

```
REPLY-ONLY (requires an inbound email to respond to):
  Standard inbound categorization/response flow (Sections 3–4).

MODULE-TRIGGERED OUTBOUND (Email Manager composes/sends on behalf of
another module's decision — the other module decides WHEN and WHAT;
Email Manager decides HOW it's formatted and delivered):
  Recovery Engine cadence messages (Module 4, all Sources A–I)
  Appointment reminders and confirmations (Module 3 enterprise
    expansion flag — full booking lifecycle)
  Consultation summaries (Step 0B Tier 2 example — "I'll send you a
    summary of what we discussed")
  Cart recovery emails (Module 4 Sources B/C)
  Booking modification confirmations
  Welcome sequences for new Engagement registrations (Module 3
    Engagement Mode A/B completion)

Full detail on this category is in Section 7 (Outbound Scope).
```

**Rule:** Email Manager never independently decides to *initiate* outbound contact with a customer on its own judgment — every module-triggered outbound email originates from another module's explicit decision (a recovery cadence step firing, a booking being confirmed, a consultation ending). Email Manager's own autonomy levels (Section 3) govern *replies to inbound mail only*.

##### 2.3 Thread Lifecycle

```
OPEN
  A new inbound email with no prior resolution. Awaiting first
  categorization/response.

WAITING-CUSTOMER
  The business (agent or human) has responded; awaiting the
  customer's next message. No action required unless/until they
  reply.

WAITING-BUSINESS
  The customer has responded (or a new email arrived) and a
  business-side action (draft approval, human review, escalation
  response) is pending.

RESOLVED
  The thread's underlying need has been addressed — no further
  action expected from either side. Consistent with Step 1G End
  State 1 applied to the email channel.

STALE
  A WAITING-CUSTOMER thread with no response after an
  archetype-appropriate window (mirroring Module 4's cadence-timing
  logic, not a fixed universal number) — eligible for Recovery
  Engine evaluation exactly as an abandoned live conversation would
  be, if the underlying content is a Module 4-eligible source (e.g.,
  an unanswered proposal follow-up, Module 4 Source G).

BOUNCE / SPAM-COMPLAINT
  Meaning: Email Manager's sent message was undeliverable
  (bounced) or the customer marked it as spam.
  Action:
    Bounce → flag for human review; do not resend automatically;
    attempt alternate channel if configured.
    Spam-complaint → trigger Module 4 suppression rule 5 above
    immediately; flag customer record; no further email outbound
    until re-permission is established.
```

**Thread Lifecycle vs. Email Status:** These are separate fields answering different questions. Email Status: what happened technically (Draft Ready / Sent / Escalated / Error). Thread Lifecycle: what is the business relationship state (Waiting-Customer / Waiting-Business / Resolved / Stale). One thread can simultaneously have Email Status = Sent and Thread Lifecycle = Waiting-Customer. Both fields required. Integration Contract v2 should add Thread Lifecycle as a new field.

**Email Status value mapping (alignment with Integration Contract's 8 allowed values):** Module 5's flows above reference status changes descriptively without always naming the exact canonical value. For pre-production DB cleanup, each of the 8 allowed values maps to a single, specific point in this module's logic — no other value is ever set:

```
New              — Email received, not yet categorized (Section 3, entry state).
Human Review
Required         — Level 1 (all emails, Section 3 Level 1) and Level 3 emails
                   that fail the 5-Condition Gate on Condition 3 or 4
                   (Section 4, Escalation path).
Draft Ready      — Level 2 draft generated (Section 3 Level 2), and Level 3
                   emails that fail Condition 1, 2, or 5 (Section 4, Draft
                   path — Level 3 falls back to Level 2 behavior for that
                   email).
Sent             — Level 2 draft approved and sent as-is or edited
                   (Section 3 Level 2, human-authorized send).
Auto Replied     — Level 3 email that passes all 5 conditions and sends
                   autonomously (Section 4, AUTO-SEND path) — distinct from
                   "Sent" specifically because it was not human-approved.
Escalated        — Reserved for escalations that leave the email channel
                   entirely (e.g., routed into Core Agent Human Handoff,
                   Module 1 Section D) — distinct from "Human Review
                   Required," which stays within Email Manager's own
                   review queue.
Closed           — Thread reaches Resolved (Thread Lifecycle) and no
                   further email action is expected.
Error            — Technical send/categorization failure, distinct from
                   Bounce (Thread Lifecycle Section 2.3, a delivery-layer
                   outcome that occurs after a successful send attempt).
```

**Rule:** No Module 5 flow sets an Email Status value outside this list. Where an earlier version of this document used a descriptive phrase ("routes to human," "falls back to draft") instead of the canonical value, the mapping above is authoritative.

##### 2.4 Ownership Model

```
AI-OWNED
  Level 3 auto-sent replies; Level 1/2 categorization and drafting
  work (drafting is AI-owned even though sending requires approval —
  ownership of the thread's next action differs from ownership of
  the send decision).

HUMAN-OWNED
  Any thread where a human has taken over — mirrors Step 3 Module 1
  D's Human Takeover & Return Path exactly: Case 1 (resolved) returns
  to AI, Case 2 (sensitive ongoing) stays human-owned, Case 3
  (unrelated new request) returns to AI. Email threads follow the
  identical case logic, just on a slower cadence than live chat.

COLLABORATIVE
  Level 2's draft-for-approval state — AI has produced the draft,
  but the thread's disposition (send as-is, edit, reject) is a human
  decision. Neither party owns the thread outright until approval
  resolves it back to AI-owned (sent) or human-owned (rejected,
  human takes over manually).
```

##### 2.5 Relationship to Other Modules

```
Recovery Engine (Module 4):     Email Manager is one of Recovery
  Engine's delivery channels (per Module 4 Section 3's channel
  column) and, separately, email-native abandonment sources (Module
  4 Section 8, Sources B–I) may originate independently of any
  Zenny conversation.
Conversion Engine (Module 3):   Booking/reservation confirmations
  and modification notices are module-triggered outbound (2.2),
  content determined by Conversion Engine's state (Module 3 Section
  1.1), delivery executed by Email Manager.
Growth Agent (Module 2):       Consultation summary emails (Tier 2
  data-collection trigger, Step 0B) are requested by Growth Agent
  during a live conversation but delivered asynchronously via this
  module.
Core Agent (Module 1):          A live-chat escalation that
  transitions to email follow-up (e.g., a human handoff that
  continues via email rather than staying in-channel) hands off
  ownership per the Human Takeover & Return Path (2.4 above).
```

##### 2.6 Attachment Intelligence Layer

Almost every real business inbox receives attachments. This layer defines how Email Manager handles them without overstepping its authority.

Attachment detection runs as part of email normalization (Section 3, Autonomy Level flows). It does not replace categorization — it supplements it.

**Attachment categories:**
```
CUSTOMER EVIDENCE
  Examples: damaged product photo, screenshot of error, proof of
  purchase.
  Effect: Increases context for human or draft path. Does not change
  escalation rules — a Refund email with a supporting photo is still
  a Refund, still escalates. The photo helps the human reviewer,
  not the autonomous agent.

BUSINESS DOCUMENT
  Examples: invoice, contract, proposal, quote.
  Effect: Confidence-lowering factor (Section 6) — the agent cannot
  reliably assess a document's contents to the standard required for
  autonomous reply; routes to draft or human review.

IDENTITY / PAYMENT SENSITIVE
  Examples: government ID, bank statement, payment screenshot.
  Effect: Always escalates, regardless of autonomy level. Never
  processed, stored as content, or referenced in a reply by the
  agent.

RECRUITING
  Examples: resume, CV, cover letter.
  Effect: Routes to the Job Application category (Section 5) —
  exits customer-facing reply logic entirely.

UNKNOWN / UNREADABLE
  Effect: Treat as a confidence-lowering factor; flag for human
  review rather than ignoring or guessing at contents.
```

**Processing flow:**
```
Email received
↓
Attachment detected?
  NO → continue normal categorization/routing
  YES → classify attachment type
         ↓
         Does attachment type force a routing change?
           YES (Identity/Payment/Unknown) → apply override routing
           NO  → add attachment context to email summary for
                  human/draft path; adjust confidence assessment
                  per type rules above
         ↓
         Continue normal autonomy-level flow with adjusted context
```

**Rule:** Attachments provide context. They do not grant action permissions. A customer sending a photo of a damaged product does not authorize a refund — that authority lives in Step 1D.1 action-level permissions, unchanged by attachment content.

##### 2.7 Channel Identity Resolution

Enterprise deployments serve the same customer across email, live chat, WhatsApp, SMS, voice, and CRM — these must not become separate customer profiles unless they genuinely are separate people.

**Input identifiers for matching:** Email address, phone number, WhatsApp ID, CRM ID, Order ID, Booking ID, session token (from live chat).

**Match confidence levels:**
```
VERIFIED MATCH: Two or more confirmed identifiers match the same
  Customer Memory record (Step 0C Level 2).
  Action: Treat as unified profile. Load Customer Memory from the
  matched record.

PROBABLE MATCH: One identifier matches, name or context
  corroborates but is not a second confirmed identifier.
  Action: Suggest merge. Do not auto-merge. Flag for human
  confirmation before treating as unified.

WEAK MATCH: Name similarity only, or partial context overlap
  with no identifier confirmation.
  Action: Keep as separate profiles. Never merge on name alone
  (per Step 0C Section 4.1 — names are not reliable unique
  identifiers).
```

**Privacy constraint:** Channel identity resolution uses Customer Memory (Step 0C Level 2) within the usage rules defined there — specifically, matching for service continuity is a permitted use, but surfacing the match result to the customer in a way that feels like surveillance ("I see you also contacted us by phone last week") is not.

**Implementation note:** Unified Customer Profile is the target enterprise state. Per-channel siloed records are the current implementation state. This section defines the intended behavior; the infrastructure to support it is flagged for Integration Contract v2.

##### 2.8 SLA and Priority Queue

Enterprise inboxes do not process emails in arrival order alone. Priority scoring determines which emails are surfaced and acted on first.

**Priority factors (higher = more urgent):**
```
COMPLAINT or REFUND category detected
  → Immediate escalation (Section 4/5 rules already enforce this;
    SLA means the human is alerted immediately, not queued).

VIP or high-value customer detected
  → Customer Memory reference (Step 0C Level 2, permitted use for
    service quality — not behavioral surveillance). When revenue
    value or account tier is available in Customer Memory, it
    elevates queue priority. This must be documented as a Level 2
    memory reference, not surfaced to the customer as "I know
    your account value."

Emergency language detected in subject/body
  → Elevated priority, even if category hasn't yet been formally
    assigned.

Existing escalation open for this customer
  → Elevated priority — a second contact from someone with an
    open issue outranks a first contact from someone without one.

Age of email (time since receipt)
  → Priority increases as time passes for non-escalated items
    — prevents low-urgency emails from sitting indefinitely.
```

**Rule:** Priority determines queue order for human review (Level 1/2) and for the order in which Level 3's autonomous processing runs when multiple emails arrive simultaneously. It does not bypass escalation rules — a Complaint email does not become auto-replyable just because it's low priority; a high-priority email does not become auto-sendable just because it's important.

##### 2.9 Global Active Issue Lock

A single customer should never receive simultaneous, potentially inconsistent contact from multiple automated actors at once.

**Priority order for ownership** (extends Module 4 Section 7.1's Recovery Ownership Rule to the full channel scope):
```
PRIORITY 1: Human agent with active ownership
  All automated actors pause. Email Manager does not draft or send.
  Recovery Engine does not send. Live chat agent defers.

PRIORITY 2: Active live conversation
  Email Manager pauses autonomous processing for this customer's
  threads. Surfaces email content as context to the live
  conversation handler instead of processing independently.

PRIORITY 3: Email Manager (active thread being processed)
  Recovery Engine defers to Email Manager if an active email
  thread is handling the same issue.

PRIORITY 4: Recovery Engine
  Default automated owner when no live conversation and no
  Email Manager thread is active.

PRIORITY 5: Scheduled automation (reminders, confirmations)
  Transactional only — these run regardless of active issue
  state because they confirm already-completed actions. Exception:
  if Priority 1 (human ownership) is active, even transactional
  outbound should be surfaced to the human for confirmation before
  sending, since the human may be aware of a context that makes
  a "your appointment is confirmed" message inappropriate.
```

**Rule:** One customer, one owner, one active issue. Collision creates inconsistency and damages trust. Priority determines who holds the active issue; others pause, not stop.

---

#### 3. Three Autonomy Levels

---

##### LEVEL 1 — Summarize Only

**Definition:** The agent reads, categorizes, and summarizes every inbound email, then notifies a human. It never drafts and never sends a reply, under any circumstance.

**What agent does:** Categorize (Section 5) → summarize → notify the assigned human channel with the summary and category.

**What agent does NOT do:** Draft reply text, suggest a response, or take any send action — Level 1 has zero send authority, not even with approval, distinguishing it from Level 2.

**Industries/use cases:** High-risk industries where any agent-originated language, even human-approved, carries outsized liability or trust risk — Emergency, legal-adjacent, medical-adjacent businesses.

**Full processing flow:**
```
Inbound email received
↓
Normalize (sender, subject, body, thread ID)
↓
Categorize (Section 5)
↓
Summarize
↓
Notify human (all replies are human-authored, no exceptions)
↓
Thread status: WAITING-BUSINESS until human acts
```

---

##### LEVEL 2 — Draft for Approval

**Definition:** The agent reads, categorizes, and summarizes, then generates a full draft reply and queues it for human approval before anything is sent.

**What agent does:** Everything Level 1 does, plus generate a complete, ready-to-send draft reply using available KB/Business Memory context.

**What agent does NOT do:** Send anything without explicit human approval — every single reply requires approval, with no auto-send exception at this level regardless of how confident the draft is.

**Industries/use cases:** Consultation, high-value commerce — situations where the cost of a wrong or off-tone reply is high enough to warrant a human check, but where drafting saves meaningful time versus writing from scratch.

**Full processing flow:**
```
Inbound email received
↓
Normalize → Categorize (Section 5) → Summarize
↓
Generate draft reply (using Business Memory / KB context)
↓
Store draft, notify human for review
↓
Human approves → send as-is
Human edits → send edited version
Human rejects → human takes over the thread manually (Human-Owned,
  2.4), draft is not sent in any form
↓
Thread status: WAITING-BUSINESS until human acts on the draft
```

---

##### LEVEL 3 — Autonomous Reply

**Definition:** The agent reads, categorizes, and summarizes, then applies the 5-condition gate (Section 4). If all 5 conditions pass, it sends a reply autonomously. If any fail, it falls to a draft or escalation path — never a silent failure.

**What agent does:** Everything Level 1/2 does, plus autonomous sending when the gate passes.

**What agent does NOT do:** Send when any gate condition fails — a single failed condition removes auto-send authority for that specific email, regardless of how the other four conditions evaluated.

**Industries/use cases:** Commerce and Appointment-style businesses with high email volume, well-covered KB content, and lower per-email stakes — where waiting for human approval on every routine question creates unnecessary delay without meaningfully reducing risk.

**Full processing flow:**
```
Inbound email received
↓
Normalize → Categorize (Section 5) → Summarize
↓
Extract relevant KB/Business Memory context for this specific question
↓
5-Condition Gate (Section 4) evaluated
↓
ALL 5 PASS       → Generate reply → Send autonomously → Thread status:
                    WAITING-CUSTOMER
ANY GATE FAILS   → Route per the specific failure:
                    Refund/Complaint category → Escalation path
                    (never drafted, never sent — routes directly to
                    human, Priority per Step 3 Module 1 D Escalation
                    Priority Classification)
                    KB coverage / pricing-sensitive / low confidence
                    → Draft path (falls back to Level 2 behavior for
                    this specific email — draft generated, human
                    approval required)
```

---

#### 3.2 Reply Style: Scripted vs. Generative

Within Level 2 (Draft for Approval) and Level 3 (Autonomous Reply), the
agent's reply is generated one of two ways — this is a configuration
choice per category, not a free choice the agent makes per email:

```
SCRIPTED REPLY:
  A pre-approved response template, filled with the specific details of
  this email (name, order number, etc.) but not generated freeform.
  Example: "We've received your complaint regarding [topic] — our team
  is reviewing it and will follow up within [timeframe]."
  Use case: High-volume, low-variance categories where consistency
  matters more than nuance (e.g., a standard complaint acknowledgment
  before human review, order-status confirmations).

GENERATIVE REPLY:
  A fully agent-composed response drawing on KB/Business Memory context,
  following all existing Module 5 rules (5-condition gate for Level 3,
  draft-then-approve for Level 2).
  Use case: Categories requiring specific, varied, context-dependent
  answers (Lead inquiries, Support questions with case-specific detail).
```

**Configuration:** Each customer-facing category (Lead, Support, Booking,
General, Partnership, Proposal — per §5) is configured with
`reply_style: scripted | generative`. Complaint and Refund remain
always-escalate regardless of this setting (§4, Conditions 3-4) — reply
style only applies to categories that reach the reply stage at all.

---

#### 3.3 Level 2 Learning Loop

When a human edits a Level 2 draft before sending, the difference between AI draft and human-approved version is a learning signal.

**Capture:**
```
- AI-generated draft (before edit)
- Human-approved version (after edit)
- Edit category: tone / factual correction / scope / escalation
  rule violation / KB gap
```

**Routing by edit category:**
```
TONE or SCOPE edit:
  Flag for KB/preference update. Requires human approval of the
  suggested update before it's applied to future drafts. Not
  automatically incorporated.

FACTUAL CORRECTION:
  Flag as a potential KB gap. Requires architect review — a single
  human edit may correct one draft correctly or may itself be
  wrong. One data point is not sufficient to update Business Memory.

ESCALATION RULE VIOLATION:
  The draft attempted to handle something it should have escalated.
  This is a module behavior gap, not a KB gap. Requires architect-
  level review and may require a rule change in Section 4 (5-
  Condition Gate) — human-draft-approval authority does not extend
  to changing escalation rules. Escalation rule updates are
  architect-level decisions only.
```

**Rule:** Learning happens through structured capture and reviewed approval. Not through automatic incorporation of any single edit. Consistent with Step 0C Section 3.2 (Memory Creation Rules) — save facts and completed events, never save interpretations as permanent attributes.

---

#### 4. The 5-Condition Gate (Level 3)

All 5 conditions must pass for auto-send. A single failure removes auto-send authority for that email — this is non-negotiable and enforced on every execution, never bypassed.

```
CONDITION 1 — Answer exists in KB
  Exact trigger: KB/Business Memory extraction for this specific
    question returns no substantive result.
  If fails: Draft path.
  Why it escalates (to draft, not auto-send): An agent should never
    auto-send a reply constructed without a real KB answer behind
    it — Step 0C Level 3 (agent must never override current business
    data with assumptions) applies to email exactly as it does to
    live chat.

CONDITION 2 — No pricing exception in the email
  Exact trigger: The inbound email contains pricing-sensitive
    language (discount requests, price-match requests, "how much
    does this cost" framed as a negotiation rather than a simple
    factual question).
  If fails: Draft path.
  Why it escalates: Pricing conversations carry discount/negotiation
    risk identical to Growth Agent's no-discount-authority rule
    (Step 3 Module 2, Objection Handling Flow) — email autonomy does
    not get more pricing latitude than live chat does.

CONDITION 3 — No refund discussion
  Exact trigger: Email category = Refund (Section 5).
  If fails: Escalation path (not draft — always a human, always
    immediately routed).
  Why it escalates: Refunds are financial-authority actions gated
    behind action-level permissions (Step 1D.1) that Email Manager
    does not hold at any autonomy level — this mirrors Core Agent's
    Complaint Handler rule that refunds are never within Core
    Agent's own authority to grant (Step 3 Module 1 C).

CONDITION 4 — No complaint requiring escalation
  Exact trigger: Email category = Complaint (Section 5).
  If fails: Escalation path.
  Why it escalates: A trust-broken customer (Universal Psychology
    Override Rule, Step 0A) needs human de-escalation exactly as it
    does in live chat — an autonomous email reply to a complaint
    risks compounding the trust damage rather than repairing it, and
    email's asynchronous nature means there's no opportunity to
    read a real-time reaction and adjust.

CONDITION 5 — AI confidence sufficient
  Exact trigger: The agent's confidence in the specific reply it
    would generate falls below the required threshold for
    autonomous sending (Section 6 defines this operationally).
  If fails: Draft path.
  Why it escalates: Directly extends the Step 1D.2 Confidence Gate
    principle ("a wrong confident action is worse than a
    clarification request") into the email channel — auto-sending a
    low-confidence reply is worse than the delay of human review,
    especially because email offers no immediate customer reaction
    to catch a miss quickly, unlike live chat.
```

**GATE FAILURE PRIORITY RULE:** When multiple conditions fail simultaneously, escalation-path failures (Conditions 3 and 4: Refund/Complaint) outrank draft-path failures (Conditions 1, 2, 5). The most severe failure determines routing. A Complaint email with no KB coverage routes to escalation (Condition 4 governs), not draft (Condition 1 alone would route to draft).

---

#### 5. Email Categorization

**All approved categories (baseline + enterprise expansion, per Section 2.1):**

| Category | Definition | Escalates? |
|---|---|---|
| Lead | New prospective customer inquiry | No |
| Support | Existing customer, service/product question | No |
| Complaint | Dissatisfaction expressed | Yes — always |
| Refund | Transaction reversal request | Yes — always |
| Booking | Appointment/reservation-related correspondence | No (unless it's a cancellation/dispute, which reclassifies) |
| General | Catch-all, doesn't fit another category | No |
| Partnership | Business-to-business inquiry, vendor/collaboration | No |
| Proposal | Sent quote/proposal awaiting response | No |
| Vendor/Supplier | Operational, not customer-facing | N/A — routes to operations, not customer autonomy logic |
| Media/Press | Journalist/media inquiry | Yes — always |
| Job Application | Recruiting-related | N/A — routes to HR/ops |
| Spam/Irrelevant | No business relevance | N/A — archived |
| Internal/Misdirected | Addressed to the business but meant for another party | N/A — routed for redirection |
| Legal/Compliance | Data requests, regulatory inquiries, legal-adjacent correspondence (EC-03) | Yes — always |
| Automated/System Notification | Inbound from an automated sender, not a customer (platform/ad-account/marketplace notifications) | N/A — filed/organized only, never reply-worthy |

**Routing per category, per autonomy level:**
```
Complaint, Refund, Media/Press, Legal/Compliance:
  ALL LEVELS → Always escalate/notify human. Never auto-reply
  regardless of autonomy level (Level 3's 5-condition gate makes
  this structurally true for Complaint/Refund via Conditions 3–4;
  Media/Press and Legal/Compliance are added as equivalent
  always-escalate categories under the Architecture Expansion Rule
  since press and legal-adjacent inquiries carry reputational/
  liability risk the original 6/8-category model didn't account
  for).

Vendor/Supplier, Job Application, Spam/Irrelevant, Internal/Misdirected,
Automated/System Notification:
  ALL LEVELS → Never enters customer-facing reply logic at any
  level — these are routing/filing categories, not response
  categories. Level 1/2/3 distinction is irrelevant to them.

Lead, Support, General, Partnership, Booking, Proposal:
  LEVEL 1 → Summarize + notify, human replies.
  LEVEL 2 → Draft generated, human approves.
  LEVEL 3 → 5-condition gate evaluated; auto-send if all pass, draft
  if a non-category condition fails (KB/pricing/confidence).
```

**Customer-facing categories** (Lead, Support, Complaint, Refund, Booking, General, Partnership, Proposal) and **Operational categories** (Vendor/Supplier, Media/Press, Job Application, Spam/Irrelevant, Internal/Misdirected, Legal/Compliance) are maintained as separate classification sets. Do not mix them in the same Airtable Single Select field. Customer categories drive autonomy-level routing. Operational categories route to business operations and never enter customer-reply logic.

---

#### 6. Confidence and Escalation

**Confidence threshold definition:** Uses the same High/Medium/Low/Conflicting vocabulary established in Step 1D.2, applied to the specific reply the agent would generate for this email:
```
HIGH:        KB/Business Memory contains a direct, substantive
             answer to the specific question asked. Sufficient for
             Level 3 auto-send (Condition 5 passes).
MEDIUM:      A partial or inferred answer exists, but some part of
             the question isn't directly covered. Not sufficient for
             auto-send — routes to draft, matching Step 1D.2's
             Medium-confidence "clarify before proceeding" principle
             applied here as "draft, don't send blind."
LOW:         No substantive KB/Business Memory match. Condition 1
             fails outright — draft path.
CONFLICTING: KB/Business Memory contains contradictory information
             relevant to the question (Step 0C Memory Conflict
             Resolution applies identically) — never auto-sent;
             routes to draft with the conflict flagged for the human
             reviewer, since resolving it requires judgment the
             agent should not exercise unsupervised in an
             asynchronous, no-immediate-feedback channel.
```

**What "confident enough to send" means operationally:** Only High confidence, combined with all other gate conditions passing (Section 4), authorizes autonomous send at Level 3. This is deliberately stricter than live chat's Confidence Gate, which allows Medium confidence to proceed with a single clarifying question (Step 1D.2) — email has no equivalent low-cost clarifying-question turn before commitment, since a "clarifying" email is itself a full send/wait/reply cycle, so the bar for unsupervised action is higher.

**Thread context memory:** Prior emails in the same thread are treated as Session Memory (Step 0C Level 1) scoped to that thread — the agent must read the full thread history before categorizing or drafting a reply, not just the latest message, so a reply doesn't ignore something already established earlier in the same exchange.

**Multi-thread per customer handling:** A single customer may have multiple simultaneous, unrelated threads open (e.g., a Support thread about an existing order and a separate new Lead thread about a different product). These are treated as independent threads with independent lifecycle states (Section 2.3) — thread context memory (above) does not cross from one thread into another automatically; if genuinely relevant cross-thread context exists (e.g., the Lead thread references the same customer's open Support issue), that is Customer Memory (Step 0C Level 2), referenced carefully per that level's usage rules, not assumed freely the way same-thread context is.

---

#### 7. Outbound Scope

Beyond inbound replies, Email Manager is the delivery execution layer for the following module-triggered outbound categories (per Section 2.2's ownership model — the originating module decides when/what, this module decides how it's sent):

```
Recovery Engine trigger emails (Module 4, Sources A–I):
  Content and cadence timing owned by Module 4 Section 4 (Recovery
  Message Logic); Email Manager executes delivery when Email is the
  configured/preferred channel for that cadence step.

Appointment reminders and confirmations:
  Transactional, not discretionary — content is templated from
  confirmed Business Memory data (date/time/service, per Module 3's
  Conversion State Machine reaching CONFIRMED). These bypass the
  5-condition gate entirely: they are not a generated judgment call,
  they are a factual confirmation of data the system already holds
  with certainty, so gate Conditions 1/2/5 (KB coverage, pricing,
  confidence) don't meaningfully apply to them.

Consultation summaries:
  Triggered by Growth Agent's Tier 2 offer (Step 0B) during a live
  conversation; content is the conversation_summary plus discussed
  specifics, composed and sent by Email Manager once the live
  conversation authorizes it.

Cart recovery emails:
  Module 4 Sources B/C (Ecommerce Abandoned Cart, Checkout
  Abandonment) — same treatment as Recovery Engine trigger emails
  above; Module 4 owns content/timing, this module owns delivery.

Booking modification confirmations:
  Same transactional treatment as appointment confirmations —
  templated from confirmed state, bypasses the discretionary
  confidence gate.

Welcome sequences for new Engagement registrations:
  Triggered by Module 3 Engagement Mode A/B reaching CONFIRMED;
  templated, mission-aligned tone per Step 0A Engagement psychology,
  transactional in the sense that the registration itself is
  already confirmed fact.
```

**Rule distinguishing transactional vs. discretionary outbound:** Transactional outbound (reminders, confirmations, welcome sequences) confirms facts the system already holds with certainty and bypasses the 5-condition gate, since there is no judgment call being made — only discretionary outbound (a generated reply to an inbound question, a recovery message requiring tone/timing judgment) is gated by Section 4/6's confidence and condition logic.

---

#### 7.1 Outbound Campaign Boundary

Email Manager handles transactional and relationship-continuation outbound. It does not equal a marketing automation or campaign engine.

**Email Manager DOES handle:**
```
✓ Replies to inbound email (Section 3)
✓ Recovery Engine cadence messages (Module 4)
✓ Booking/appointment confirmations and reminders
✓ Consultation summaries
✓ Booking modification confirmations
✓ Welcome sequences for new registrations
```

**Email Manager does NOT handle:**
```
✗ Mass email campaigns (newsletters, promotions)
✗ Cold outbound to non-engaged contacts
✗ Segmented marketing lists
✗ A/B test campaigns
✗ Any outbound not triggered by a specific, individual customer
  event or decision
```

**Rule:** Email Manager is an employee, not a broadcast system. It handles one customer at a time, responding to real events. Mass outbound requires a dedicated Marketing Module not defined in this document. Clients asking "can it email all my old customers?" are describing a Marketing Module capability, not Email Manager.

---

#### 8. Edge Cases

```
EC-01: Email chain involves multiple departments, and the agent only
       sees the portion addressed to (or CC'd to) the monitored inbox
       — the full context of the conversation may exist in a thread
       branch the agent cannot see.
       Handling: Treat visibility gaps as a confidence-lowering
       factor (Section 6) — if the visible portion of the thread
       reads as incomplete or references something not present in
       what the agent can see ("per my earlier note to Sarah..."),
       this is a Medium/Low confidence signal, not a High-confidence
       KB match, and routes to draft or escalation rather than
       auto-send on an incomplete picture.

EC-02: Customer emails from a different address than the one on
       record (e.g., a work email vs. the personal email used at
       signup).
       Handling: Per Step 0C Section 4.1 (Shared Identity Handling),
       do not assume the new address is the same customer just
       because the content sounds familiar — match by other
       confirmed identifiers where possible (order number, name +
       context), and if genuine identity is uncertain, this is
       itself a confidence-lowering factor requiring human review
       rather than an assumption resolved silently by the agent.

EC-03: Legal or compliance-adjacent email content (e.g., a data
       request, a cease-and-desist-adjacent tone, a regulatory
       inquiry).
       Handling: Always escalates, at every autonomy level, with no
       exception — added as an implicit extension of the Media/Press
       always-escalate category (Section 5); legal-adjacent content
       carries the same reputational/liability profile that
       justifies Level 1 existing as a category in the first place,
       so it must never be eligible for Level 3 auto-send regardless
       of how confidently the KB might seem to answer it.

EC-04: Auto-reply loop — the customer's own email system has an
       auto-responder (e.g., an out-of-office or a ticketing system)
       that automatically replies to the agent's message, which could
       trigger the agent to reply again, looping indefinitely.
       Handling: Detect auto-generated messages (common headers/
       patterns indicating an automated sender) and do not enter
       them into the normal categorization/reply pipeline at all —
       an auto-reply is not a customer message requiring a response,
       and the thread should not treat a bounce-back auto-reply as a
       new inbound requiring the same handling as a real customer
       email.

EC-05: Thread hijacking — the customer CC's new people mid-thread
       (e.g., adds a colleague, a spouse, or an unrelated third
       party) partway through an existing conversation.
       Handling: Treat the newly added participant per Step 0C
       Section 4.1's Shared Identity Handling logic — do not assume
       the new participant has the same history/context as the
       original sender; if the new participant's own message
       introduces a request that requires identity-sensitive
       handling (Section EC-02's logic), apply the same caution
       rather than extending the original sender's established
       context to them automatically.

EC-06: Email is received from a customer who is simultaneously in an
       active live chat conversation.
       Handling: Per the Recovery Ownership Rule pattern established
       in Module 4 Section 7.1 (Priority: human ownership > active
       live conversation > automated engine), an active live
       conversation takes priority — the email should not receive an
       independent, potentially inconsistent autonomous reply while
       the same customer is actively being served in real time.
       Route the email to WAITING-BUSINESS status and surface it as
       context to whichever channel (agent or human) is actively
       handling the live conversation, rather than processing it
       through the normal autonomy-level pipeline in parallel.
```

---

## STEP 3 MODULE 5 COMPLETION SUMMARY

- **Sections completed:** 1. Purpose, Scope & Activation / 2. Inbox Intelligence Model (2.1–2.9, including Attachment Intelligence Layer, Channel Identity Resolution, SLA and Priority Queue, Global Active Issue Lock) / 3. Three Autonomy Levels / 3.2 Reply Style: Scripted vs. Generative / 3.3 Level 2 Learning Loop / 4. The 5-Condition Gate (+ Gate Failure Priority Rule) / 5. Email Categorization (+ customer-facing vs. operational classification split) / 6. Confidence and Escalation / 7. Outbound Scope / 7.1 Outbound Campaign Boundary / 8. Edge Cases
- **Decisions made:**
  - Adopted the Integration Contract's 8-category baseline (rather than the n8n Build Guide's narrower 6) as the starting point, since the Contract is the more complete existing source, then expanded further per the Architecture Expansion Rule to 6 additional enterprise categories (Vendor/Supplier, Media/Press, Job Application, Spam/Irrelevant, Internal/Misdirected, Legal/Compliance) that neither existing source document covers but any real business inbox receives.
  - Extended the always-escalate rule beyond Complaint/Refund (the only two enforced by the existing 5-condition gate) to also cover Media/Press and Legal/Compliance content — reasoning that the same liability/reputational logic that justifies Complaint/Refund's hard escalation applies at least as strongly to press and legal correspondence, which the demo-phase implementation never had reason to consider.
  - Defined a hard distinction between transactional and discretionary outbound email (Section 7) — transactional confirmations bypass the 5-condition gate entirely because they confirm already-certain facts rather than generating a judgment call, while discretionary outbound (replies, recovery messages) remains fully gated. This wasn't explicit in either source document and was necessary to avoid absurdly gating a routine "your appointment is confirmed for 3pm" message through KB-confidence logic meant for judgment calls.
  - Set email's autonomous-send confidence bar at High only (never Medium), stricter than live chat's Step 1D.2 Confidence Gate which allows Medium to proceed with one clarifying question — justified because email has no equivalent low-cost clarification turn before an irreversible send, unlike a live chat exchange.
  - Extended Module 4's Recovery Ownership Rule (7.1) into Email Manager's Global Active Issue Lock (2.9) as a 5-level priority order (Human > Live Conversation > Email Manager > Recovery Engine > Scheduled Automation) rather than inventing a separate ownership model — keeps the "one customer, one owner" principle consistent across every automated channel in the document, not just recovery cadences.
  - Level 2's Learning Loop (3.3, renumbered from 3.1 in Batch 3 Round 4 to make room for the new Reply Style sub-mode at 3.2) was scoped to capture-and-flag only, never auto-incorporation, explicitly mirroring Step 0C Section 3.2's Memory Creation Rules (never save interpretations/single data points as permanent attributes) — a single human edit is a signal to review, not a standing behavior change.
- **Open questions:**
  - The enterprise category expansion (Vendor/Supplier, Media/Press, Job Application, Spam/Irrelevant, Internal/Misdirected, Legal/Compliance) has no corresponding Airtable Single Select values yet (the n8n guide states categories "must match the Airtable Emails table Single Select options exactly") — architect should confirm whether these are added to the schema or handled via a separate non-customer-facing routing mechanism entirely outside the Emails table.
  - EC-04's auto-reply-loop detection and EC-06's live-chat/email collision handling both assume real-time cross-channel visibility (knowing a customer is "currently" in live chat while an email arrives) that isn't defined anywhere else in this document as an existing capability — this depends on session-state infrastructure not yet specified at the level of detail this edge case assumes. Section 2.9's Global Active Issue Lock now defines the *rule*, but the underlying real-time presence detection it depends on is still an infrastructure gap.
  - Section 2.7's Channel Identity Resolution (Verified/Probable/Weak match tiers) depends on a Unified Customer Profile that does not yet exist in the current per-channel-siloed implementation — explicitly flagged in that section as a target state, not a current capability.
- **Resolved this pass:**
  - **Thread Lifecycle vs. Email Status (Section 2.3):** These are confirmed as separate fields answering different questions — Email Status describes what happened technically (Draft Ready / Sent / Escalated / Error); Thread Lifecycle describes the business relationship state (Waiting-Customer / Waiting-Business / Resolved / Stale). Both fields are required simultaneously on a thread. Integration Contract v2 should add Thread Lifecycle as a new field rather than overloading Email Status to carry both meanings.
  - **Enterprise vs. operational category mixing (Section 5):** Customer-facing categories and Operational categories are confirmed as separate classification sets, never mixed in one Airtable Single Select field — customer categories drive autonomy routing, operational categories exit customer-reply logic entirely.
- **Enterprise Expansion Flags** (per Architecture Expansion Rule — remaining gaps beyond what Sections 1–8 now cover, noted for future expansion):
  - **Voice-to-email and channel convergence:** Section 2.7 (Channel Identity Resolution) defines how to match identity across channels, but does not yet define unified *conversation* logic — a voice call transcript, an SMS, and an email about the same issue are still tracked as separate threads even once identity is resolved to one customer.
  - **Multi-language detection:** No rule exists for detecting a non-default-language inbound email and routing/translating appropriately versus misreading it as low-confidence/no-KB-match.
  - **Attachment handling:** Resolved this pass — see Section 2.6 (Attachment Intelligence Layer).
- **Batch 3 Round 4 (Data Architecture & Cleanup) applied — Patch 9 remainder, all 4 parts:**
  - **3.2 Reply Style: Scripted vs. Generative** — new subsection, inserted before the renumbered 3.3 Learning Loop. Per-category `reply_style: scripted | generative` config for Level 2/3 replies; Complaint/Refund remain always-escalate regardless of this setting.
  - **Automated/System Notification category** — added to Section 2.1's Enterprise Expansion list and to Section 5's routing table (never enters customer-facing reply logic, alongside Vendor/Supplier/Job Application/Spam/Internal-Misdirected). Formalizes the detection mechanism already implied by EC-04's auto-reply-loop handling into a named category.
  - **Category Extensibility note** — added to Section 2.1, confirming the category list is Business-Config-loaded and client-extensible, not a fixed constant.
  - Section 2.1's "no corresponding Airtable Single Select values yet" open question (above) now also applies to the new Automated/System Notification category.
- **Ready for architect review:** YES

---

## STEP 3 ALL MODULES COMPLETION SUMMARY

- **All 5 modules complete:** YES — Module 1 (Core Agent, always active), Module 2 (Growth Agent), Module 3 (Conversion Engine), Module 4 (Recovery Engine), Module 5 (Email Manager).
- **Cross-module consistency check:**
  - All 5 modules consistently use the shared Step 1D.2 Confidence Gate vocabulary (High/Medium/Low/Conflicting) rather than inventing per-module confidence systems — Email Manager (Module 5, Section 6) is the clearest extension of this, explicitly noting where its threshold is stricter than live chat's and why.
  - All 5 modules respect the Step 1D.1 action-level permission model — no module grants itself an action (discount, refund, booking, send) without an explicit permission check, and every gated action has a defined fallback rather than a dead end.
  - Handoff payloads between modules were named consistently and cross-referenced rather than redefined ad hoc: Growth Agent → Conversion Engine (Module 2 Section 3 / Module 3 Section 1), Conversion Engine/Growth Agent → Recovery Engine eligibility (Module 3 Section 5.1 as the single source of truth Module 2 and Module 4 both defer to), and Recovery Engine / Conversion Engine / Growth Agent / Core Agent → Email Manager for outbound delivery (Module 5 Section 2.2/7).
  - The Human Takeover & Return Path (Module 1 Section D) is reused rather than reinvented in both Module 4 (Recovery Ownership Rule, 7.1) and Module 5 (Ownership Model, 2.4) — human-owned/AI-owned/collaborative states resolve the same way regardless of channel.
  - The Architecture Expansion Rule's retrospective pass surfaced genuine gaps in Modules 1–3 (Enterprise Expansion Flags added to each) without altering any previously-approved content — expansion flags were appended, not retrofitted into existing flows, preserving prior architect approvals.
  - **RESOLVED (Step 6 review patch):** Module 5's Email Status values are now explicitly mapped one-to-one against the Integration Contract's 8 allowed values (Module 5 Section 2.3, "Email Status value mapping") — every status-setting point in Module 5's flows resolves to exactly one canonical value, with no other value ever set. This was LOW severity (pre-production-DB cleanup, not a functional defect) and did not require changing the Integration Contract itself, unlike Module 4's Recovery Status correction which did.

---

### Enterprise Expansion Audit

Structured audit per the Architecture Expansion Rule. Each module answered against the same 4 questions; gaps flagged [MVP] (should be in v1 implementation) or [FUTURE] (post-v1 capability).

---

#### MODULE 1 — Core Agent

**Q1 — AI-conversation-only, or external events too?**
AI-conversation-only. Every sub-flow (FAQ, Support, Complaint, Human Handoff, Off-Topic) is triggered by a classified inbound customer message (Step 1B). No external system event (an order-delay notice, a shipping exception, a system-detected service disruption) currently triggers proactive Core Agent action — this was already flagged as a gap in Module 1's own Enterprise Expansion Flags ("Proactive support triggers").

**Q2 — Full lifecycle states needed vs. currently missing:**
A real support operation needs: Opened → Acknowledged → In Progress → Waiting-on-Customer → Waiting-on-Business → Resolved → Reopened → Closed, tracked at the *issue* level, potentially spanning multiple conversations/sessions. Current spec tracks state only within a single conversation (via Step 1G End States) — there is no persistent issue/ticket record that survives across sessions, and no "Reopened" state distinct from a fresh new conversation about the same topic.

**Q3 — External systems needed to feed this module:**
Order management / fulfillment system (status, delay/exception events), ticketing or helpdesk system (if issue tracking lives outside Airtable), CRM (deeper history than Lead/Conversion records alone), inventory/product system (KB-adjacent live facts), an event bus for proactive triggers (fulfillment delays, service disruptions), and channel platforms themselves (WhatsApp Business API, SMS gateway, voice/IVR) for true channel-agnostic behavior.

**Q4 — Top 3 commercially significant gaps:**
```
1. [MVP] Channel-agnostic behavior (WhatsApp/SMS/voice parity) —
   most enterprise clients deploy multi-channel from day one; a
   chat-only spec is immediately visible as incomplete.
2. [MVP] Proactive support triggers (system-detected issue → agent
   reaches out first) — this is one of the clearest "AI employee
   vs. chatbot" differentiators the whole document's philosophy
   promises, and it's entirely absent from Module 1 as written.
3. [FUTURE] Knowledge base freshness detection — real and
   trust-relevant, but a slower-burning gap that degrades quality
   gradually rather than being immediately noticed at launch.
```

---

#### MODULE 2 — Growth Agent

**Q1 — AI-conversation-only, or external events too?**
AI-conversation-only. Discovery, Recommendation, Objection Handling, Internal Recovery, and Opportunity Detection all operate strictly within a live conversation. No external signal (a restock event, a price change, a pre-conversation browsing session) currently informs this module's behavior — consistent with its own Enterprise Expansion Flags (cross-session behavioral context, inventory-aware recommendation).

**Q2 — Full lifecycle states needed vs. currently missing:**
A real sales pipeline needs: New → Engaged → Qualified → Nurtured → Converted → Lost/Disqualified. This module defines *in-conversation* buying stages (Explorer/Evaluator/Ready Buyer, Section A.0) but has no persistent lead-lifecycle status that survives across sessions, and critically has no formal "Lost/Disqualified" state distinct from "Open Opportunity" — every non-conversion currently defaults toward Recovery Engine eligibility with no way to mark a lead as genuinely closed-lost (as opposed to still-recoverable).

**Q3 — External systems needed to feed this module:**
Inventory/stock system (live availability for recommendation confidence), product information management / catalog system (relationship-graph data for structured upsell logic), pricing engine (real-time price accuracy), CRM/marketing analytics platform (cross-session behavioral signals), and web analytics (pre-conversation browse history).

**Q4 — Top 3 commercially significant gaps:**
```
1. [MVP] Inventory-aware recommendation — a Commerce client will
   notice immediately and repeatedly if the agent confidently
   recommends out-of-stock items; this directly undermines trust
   in the module's core function.
2. [MVP] Product/service relationship graph — Opportunity Detection
   (Module 2 Section E) currently has no structured data behind
   "what complements what," which caps how effective upsell/
   cross-sell can ever be regardless of conversational quality —
   this is the module's revenue-generating purpose, so the gap is
   commercially central, not peripheral.
3. [FUTURE] Cross-session behavioral context — valuable
   personalization, but its absence degrades quality rather than
   creating a visible failure the way the first two do.
```

---

#### MODULE 3 — Conversion Engine

**Q1 — AI-conversation-only, or external events too?**
Mixed. Entry is strictly AI-conversation-driven (Intent 03), and the Conversion State Machine (Section 1.1) already consumes external system *results* (cart API success/failure, calendar write success/failure) as part of its own logic. But it does not yet consume external events that originate entirely independently of any Zenny conversation — e.g., a staff member manually rescheduling a booking in the calendar system, or a customer completing a purchase through a different channel entirely, both of which this module currently has no way to learn about.

**Q2 — Full lifecycle states needed vs. currently missing:**
The Conversion State Machine (1.1: INTENT_CONFIRMED → DATA_COLLECTION → ACTION_PENDING → CONFIRMED/FAILED_RECOVERABLE/FAILED_ESCALATION/CANCELLED) is a genuinely strong model for the *creation* transaction — but Module 3's own Enterprise Expansion Flags already name the gap precisely: the full post-booking lifecycle (Created → Confirmed → Reminder Sent → Reschedule Requested → Cancelled → No-Show → Reactivation) is not covered at all. This module currently has nothing to say about anything that happens to a booking after CONFIRMED.

**Q3 — External systems needed to feed this module:**
Calendar/scheduling system webhooks (externally-initiated reschedule/cancel events), payment gateway webhooks (asynchronous payment confirmation, external refund initiation), inventory/stock system (live sync, not just at the moment of conversion), CRM (for Consultation score inputs), SMS/push notification platform (for reminders), and POS system (for Commerce, to detect in-store completion of an online-initiated interest).

**Q4 — Top 3 commercially significant gaps:**
```
1. [MVP] Full post-booking lifecycle (reminders, reschedule,
   no-show, reactivation) — this is baseline expected functionality
   for any Appointment-archetype business; its complete absence is
   the single most visible gap in this module for a typical client.
2. [MVP] External modification sync (detecting a staff-initiated
   reschedule/cancellation) — without this, the agent can confidently
   reference a booking that no longer exists or has changed, a
   direct trust and operational-risk issue, not just a missing
   nice-to-have.
3. [FUTURE] Payment method fallback on failure — valuable, but
   narrower in scope (Commerce-specific) than the first two,
   which affect every archetype using this module.
```

---

#### MODULE 4 — Recovery Engine

**Q1 — AI-conversation-only, or external events too?**
Already explicitly mixed by design. Section 8 (Enterprise Recovery Scope Expansion) defines 9 recovery sources, 8 of which (Sources B–I) are external-origin by definition — cart/checkout/payment/booking/form abandonment, proposal expiry, customer reactivation, and review triggers all originate outside any Zenny conversation. This is the one module that already fully answers Q1 in its own text; the gap is implementation (webhook integration), not conceptual scope.

**Q2 — Full lifecycle states needed vs. currently missing:**
Recovery Status (this session: Active/Paused/Completed/Stopped) is reasonably complete after this pass's corrections. Two states are still implicit rather than explicit: a "Scheduled" state for a record created but whose first cadence step hasn't fired yet (currently folded into "Active" without distinction), and a clean resumption path for Paused → Active when human ownership ends *without* the customer replying (Section 6.1 defines resumption triggered by a customer reply, but not the case where a human simply closes their task and recovery should logically resume on its own).

**Q3 — External systems needed to feed this module:**
Ecommerce platform webhooks (Shopify/WooCommerce cart/checkout events), payment gateway webhooks, booking platform webhooks (Calendly/Google Calendar), form platform webhooks (Typeform, website forms), CRM (proposal status, reactivation threshold tracking), and review platform APIs (Google/Trustpilot/Yelp).

**Q4 — Top 3 commercially significant gaps:**
```
1. [MVP] Ecommerce cart/checkout abandonment webhook integration
   (Sources B/C) — one of the single highest-ROI automated-recovery
   capabilities in commerce; conceptually defined in this document
   but not connected to any actual platform yet, and it's the
   capability clients are most likely to ask for by name.
2. [MVP] Paused-state resumption without a reply (Q2 above) — a real
   production-risk bug class: a lead escalated to a human, then
   quietly closed by that human without ever replying, could get
   permanently stuck in Paused with no defined path back to Active.
3. [FUTURE] Customer reactivation (Source H) — a genuine long-term
   relationship/LTV play, but not the kind of gap a client notices
   in the first weeks of production the way cart-recovery absence
   would be.
```

---

#### MODULE 5 — Email Manager

**Q1 — AI-conversation-only, or external events too?**
Mostly conversation/module-triggered. Inbound replies are customer-initiated; outbound is either a reply or module-triggered (Section 2.2, other modules deciding when/what). Genuinely external, email-infrastructure-level events — a bounce notification, a delivery-failure webhook, a spam-complaint webhook from the sending provider — are not yet addressed anywhere in this module, despite being fundamental to email as a channel.

**Q2 — Full lifecycle states needed vs. currently missing:**
Thread Lifecycle (Open/Waiting-Customer/Waiting-Business/Resolved/Stale) plus Email Status are reasonably thorough after this session's Resolution 1. Missing: a Bounce/Delivery-Failed state (the system currently has no way to know a "Sent" email never actually arrived), a Spam-Complaint state (should trigger suppression, related to but not currently unified with Module 4's Customer Suppression Rules), and an explicit Archived state distinct from Resolved for aged-out threads.

**Q3 — External systems needed to feed this module:**
Email Service Provider webhooks (bounce, delivery-failure, spam-complaint, and optionally open/click tracking), CRM (to power the Unified Customer Profile target state from Section 2.7), calendar/booking systems (for confirmation-content accuracy), an OCR/document-processing service (to make the Attachment Intelligence Layer, Section 2.6, actually read attachment contents rather than just classify them), a translation service (for the multi-language gap), and voice/SMS platforms (for the channel-convergence gap).

**Q4 — Top 3 commercially significant gaps:**
```
1. [MVP] Bounce/delivery-failure handling — without this, the
   system can report "Sent" on a message that never reached the
   customer, which is a silent, compounding trust failure across
   every other module that relies on Email Manager for delivery
   (Recovery Engine cadences, appointment confirmations, etc.).
2. [MVP] Unified Customer Profile infrastructure (Section 2.7
   defines the matching *rule*, not the implementation) — clients
   will notice quickly if the same person is treated as a stranger
   across email and live chat, undermining the "AI employee, not
   a chatbot" premise this entire document is built on.
3. [FUTURE] Attachment content extraction (OCR/document parsing) —
   Section 2.6 already defines classification and routing of
   attachments; actually reading their contents is a real
   enhancement but not blocking for the module to be useful at
   launch.
```

- **Critical Fix 2 applied** — Recovery Paused→Active resumption path defined for human task closure without customer reply.
- **Ready for architect review:** YES

---

## STEP 4 — Archetype Operating Systems

### ARCHETYPE 1 — Emergency Engine (Agentic 2/10 · SOP 9/10)

This section applies the Universal Runtime (Step 1), Freedom Boundary Spec (Step 2), and Service Modules (Step 3) to Emergency's specific customer reality. Nothing here overrides those steps — this is the archetype-specific configuration and journey built on top of them. Appendix B Flags 1 and 2 are applied directly in Sections 3/5/6 (Flag 1 — non-emergency/quote request branch) and Section 8 (Flag 2 — human queue unavailability).

---

#### 1. Customer Psychology Summary

Reference: Step 0A Archetype 1 (Emergency) in full. Restated briefly with runtime implications:

```
Mental state:      Active problem, low cognitive bandwidth, comparing
                    providers by speed and competence.
Trust level:       Low, earned fast through competence signals.
Patience Window:   SHORT. Discovery tolerance: Very Low.
Relationship/
Transaction:       80% Transaction / 20% Relationship.
Win condition:     Confirmation that help is coming, with a concrete
                    time window.
```

**Runtime implications (what this psychology forces at the architecture level):**
```
- Freedom Level 2/10 (Step 2) is not a stylistic choice — it is the
  direct operational consequence of Very Low discovery tolerance:
  1 fixed question at a time, no reordering, no proactive
  recommendation, no off-script exploration.
- Step 0B's Tier 3-only data collection (no Tier 1/2 earn-it-first
  step) is the direct operational consequence of 80/20 Transaction
  weighting — there is no room for a value-exchange moment before
  asking for contact info; urgency itself is the justification.
- The Universal Psychology Override Rule (Step 0A) still applies
  inside Emergency: a Complaint (Priority 2) or genuine Safety
  signal (Priority 1) always preempts the standard triage sequence,
  per Step 1E.
- Step 0A's Emergency edge cases (research-only customer, silent
  customer after callback promise, genuine life-safety hazard) are
  expanded into full decision-tree branches below (Section 5) rather
  than left as flagged notes.
```

---

#### 2. Common Entry Scenarios

Minimum 10 realistic opening messages, each with what it signals.

```
1. "My roof is leaking, can someone come today?"
   Signals: Ready buyer, moderate urgency, timing is the primary
   concern. → Standard triage → Callback Queue (Conversion Mode A).

2. "water is coming through my ceiling right now what do i do"
   Signals: Active crisis, high stress. → Immediate safety guidance
   branch (Section 5) before/alongside routing.

3. "how much does it usually cost to fix a burst pipe"
   Signals: Research-mode, no active emergency stated. → Flag 1
   branch: Non-Emergency/Quote Request (Section 3/6).

4. "I called earlier about my breaker box, following up"
   Signals: Returning Lead session state (1A), needs context recall,
   not a restart.

5. "is this the same company that did my neighbor's roof"
   Signals: Low trust, legitimacy-testing before disclosing own
   issue.

6. "my dad's basement is flooding and he doesn't know how to use a
   phone well, can you help him"
   Signals: Customer acting on behalf of someone else. → On-Behalf-Of
   branch (Section 5).

7. "how do i shut off my main water valve myself"
   Signals: DIY customer. → DIY branch (Section 5) — safety-relevant
   information may be given, but this is not a substitute for triage.

8. "do you guys service [zip code/area]"
   Signals: Out-of-zone check, may or may not have an active
   emergency yet. → Out-of-Zone branch (Section 5).

9. "THIS IS THE THIRD TIME THIS HAS HAPPENED AND NO ONE HELPED ME
   LAST TIME"
   Signals: Complaint (Priority 2) arriving inside what may also be
   an active emergency — Universal Psychology Override applies;
   de-escalation (Core Agent, Module 1 C) takes priority over triage
   sequencing, without abandoning the safety check.

10. "just want a quote for replacing my whole roof sometime this
    year, no rush"
    Signals: Explicitly non-urgent. → Flag 1 branch (Section 3/6),
    routed toward Inspection Slot Booking (Conversion Mode B), not
    Callback Queue.

11. "smell gas near my stove, is that bad"
    Signals: Active life-safety hazard. → Highest-priority branch
    (Section 5) — supersedes all other logic per Step 0A.

12. "can you send someone tomorrow instead of today, today doesn't
    work for me"
    Signals: Ready buyer, but customer-driven timing constraint —
    triage proceeds, but the callback-window promise (Section 6)
    must reflect the customer's actual availability, not just system
    default.
```

---

#### 3. Full Conversation Journey Map

**Happy path:**
```
Customer message received
↓
1A Session State Check (New / Returning Lead / Existing Customer /
   Dormant Customer)
↓
1B Intent Classification
↓
1D Module Routing (Core Agent always active; Growth/Conversion/
   Recovery per config)
↓
Severity classification (single fixed question if not already
   evident from the message: "is this actively happening right now,
   or can it wait?")
↓
Active danger?
  YES → Immediate safety guidance (Section 5) interleaved with data
        collection
  NO  → continue
↓
Non-emergency / quote request signal? (Flag 1, Section 5)
  YES → Inspection Slot Booking branch (Conversion Mode B)
  NO  → continue
↓
Location + phone collected (Tier 3, Step 0B — no earn-it-first step)
↓
Action Permission Check (1D.1): job queue / dispatch permission
   granted?
  YES → Callback Queue created (Conversion Mode A)
  NO  → Mode C (Human Callback / Escalation)
↓
Concrete time window communicated ("a technician will call within
   15 minutes")
↓
Step 1G Exit: End State 1 (dispatch confirmed)
```

**Branch paths (each detailed fully in Section 5):**
```
- Active safety hazard branch (gas, sparking, structural risk)
- Non-emergency / quote request branch (Flag 1)
- Out-of-zone branch
- DIY branch
- On-behalf-of-someone-else branch
- Complaint/angry-customer-mid-emergency branch
- Human queue unavailable branch (Flag 2, Section 8)
```

---

#### 4. Data Collection Timing

Applying Step 0B doctrine specifically to Emergency:

```
Tier applied: Tier 3 (Commitment Capture) only. No Tier 1/2
  earn-it-first step — per Step 0B's explicit archetype mapping,
  urgency and safety context make upfront collection natural.

Exact timing: Location and phone are collected immediately, in the
  same exchange as (or immediately following) severity classification
  — not after a discovery sequence, because none exists at this
  freedom level.

Sequence:
  1. Severity question (1 fixed question, per Freedom Level 2/10)
  2. Location + phone (Tier 3, collected together — Step 0B does not
     require splitting these into separate turns for Emergency, given
     the Very Low patience window)
  3. Concrete time-window confirmation

Special case — active danger: Safety guidance is given in PARALLEL
  with data collection, not sequentially after it (per Step 0A
  Emergency's "what creates confidence" — reassurance about the next
  few minutes takes priority, but does not replace getting location/
  phone captured quickly).

Special case — Flag 1 (non-emergency/quote request): Tier 3 collection
  still applies (name + contact + preferred date/time for the
  inspection slot, per Conversion Engine Mode B), but is not preceded
  by an urgency framing — the "why we need this now" justification
  shifts from safety to simply completing a booking, consistent with
  Module 3's Inspection Slot Booking flow.
```

---

#### 5. Decision Tree

All conditions with explicit YES/NO branches. No dead ends.

```
MESSAGE RECEIVED
↓
IS THIS A GENUINE LIFE-SAFETY HAZARD? (gas smell, sparking,
structural collapse risk — Step 0A Emergency edge case)
  YES → Immediate safety guidance FIRST, before any routing question.
        Capture location + phone in parallel (Section 4).
        → Escalation Priority 1 (Module 1 D) → Section 8.
  NO  → continue
        ↓
IS THIS A COMPLAINT OR TRUST-BROKEN SIGNAL? (Priority 2, Universal
Psychology Override)
  YES → Route to Core Agent Complaint Handler (Module 1 C) FIRST.
        De-escalate before resuming any triage sequence. If the
        underlying issue is also an active emergency, safety guidance
        is not skipped — it runs alongside de-escalation, not after it.
  NO  → continue
        ↓
IS THE CUSTOMER ACTING ON BEHALF OF SOMEONE ELSE? (Entry Scenario 6)
  YES → Collect the actual affected party's location and a reachable
        contact method (may be the caller's own number if the
        affected party can't easily use a phone) — do not require the
        affected party to be on the line themselves. Proceed through
        the same triage sequence with the caller as an authorized
        intermediary.
  NO  → continue
        ↓
IS THIS AN ACTIVE, HAPPENING-NOW PROBLEM?
  NO  → IS THIS A RESEARCH/QUOTE REQUEST WITH NO ACTIVE ISSUE?
        (Flag 1 — Appendix B)
          YES → Non-Emergency/Quote Request branch: answer pricing/
                service questions factually from KB (Core Agent FAQ
                Handler), then offer Inspection Slot Booking
                (Conversion Mode B, Section 6) — NOT the Callback
                Queue. No manufactured urgency (Step 0A rule).
          NO  → Treat as Solution-Aware but non-urgent (e.g., Entry
                Scenario 12) — proceed through standard triage but do
                not force the 15-minute callback framing; confirm
                actual timing constraints before setting the window.
  YES → continue
        ↓
IS THIS A DIY REQUEST? ("how do I fix this myself" / "how do I shut
off my own valve")
  YES → Agent MAY provide safety-relevant, KB-confirmed information
        (e.g., "if safe to do so, shutting off the main valve is
        located...") but this does NOT replace or skip triage — the
        agent still asks whether a technician is wanted, since a DIY
        question does not mean the customer has decided against
        professional help. No product tour, no upsell.
  NO  → continue
        ↓
IS THE CUSTOMER OUT OF SERVICE ZONE?
  YES → State plainly and immediately once location is known: "We
        don't currently service [area] — I don't want to waste your
        time waiting on us." Offer a referral if one is configured in
        Business Memory; if not, end the conversation respectfully
        (Step 1G End State 1 — the interaction's job, giving an
        honest answer, is complete).
  NO  → continue
        ↓
LOCATION + PHONE COLLECTED (Tier 3, Section 4)
↓
ACTION PERMISSION CHECK (1D.1): job queue / dispatch permission
granted?
  YES → Proceed to Conversion Mode A (Callback Queue)
  NO  → Proceed to Conversion Mode C (Human Callback / Escalation)
        ↓
IS A HUMAN AVAILABLE TO RECEIVE THIS ESCALATION/DISPATCH? (Flag 2 —
Appendix B, full rule in Section 8)
  YES → Standard time-window promise ("technician will call within
        15 minutes")
  NO  → Human Queue Unavailable branch (Section 8) — adjusted,
        honest timing communicated instead of a promise that can't
        be kept.
↓
Step 1G Exit
```

---

#### 6. Conversion Path

Full flow for both Conversion Engine modes relevant to Emergency (per Step 3 Module 3), applied at the archetype level.

**Callback Queue (Mode A) — active/urgent situations:**
```
Entry: Active danger classified per Section 5's decision tree (not
  Flag 1's non-emergency branch).
1. Location + phone confirmed (Section 4).
2. Action Permission Check (1D.1) — job queue permission granted.
3. Human availability check (Flag 2, Section 8) — determines whether
   the standard 15-minute promise applies or an adjusted window is
   communicated instead.
4. State the time window explicitly: "a technician will call you
   within 15 minutes" (or the adjusted window from Section 8).
5. Create callback queue entry — Conversion State Machine transitions
   INTENT_CONFIRMED → DATA_COLLECTION → ACTION_PENDING → CONFIRMED
   (Module 3 Section 1.1).
6. Duplicate Action Protection (Module 3 Section 1.2) — if an active
   callback queue entry already exists for this customer/location/
   issue, confirm the existing entry rather than creating a second one
   ("You're already in our queue for this — a technician will still
   reach out within the window I gave you").
Exit: Step 1G End State 1 (dispatch confirmed).
```

**Inspection Slot Booking (Mode B) — non-urgent / Flag 1 quote requests:**
```
Entry: Flag 1 branch (Section 5) — research/quote/non-urgent request,
  no active danger.
1. Answer factual pricing/service questions from KB first (Core
   Agent FAQ Handler) — this is allowed even at Freedom 2/10 because
   it's a direct factual answer, not a recommendation or discovery
   sequence.
2. Once the customer wants to move forward, collect preferred date/
   time + Tier 3 contact fields (Section 4's special case).
3. Book an inspection slot (calendar_event_id created, per
   Integration Contract Calendar Standards) — standard, non-urgent
   booking mechanics, not the callback queue.
4. Confirm explicitly: "You're booked for an inspection on [date] at
   [time]."
Exit: Step 1G End State 1.
```

**Relationship to Mode C (Emergency Escalation):** Per Module 3, Mode C is reserved for the genuine life-safety hazard branch (Section 5) and for cases where Mode A's action permission isn't granted or its dispatch action fails (Module 3 Section 5, Failure Handling — "EMERGENCY DISPATCH ACTION FAILS" is the highest-severity failure case defined in the entire document, routing immediately to Human Handoff Handler at Priority 1).

---

#### 7. Recovery Trigger Moments

Exact triggers and non-triggers, per Module 4 applied specifically to Emergency.

```
RECOVERY TRIGGER (exact moment):
  Callback requested (Conversion Mode A reaches ACTION_PENDING) but
  not confirmed reached within the callback window (per Module 4
  Section 2).

RECOVERY PROFILE: Emergency — 15 min → 6 hr → 24 hr, 3 steps, per
  Module 4 Section 3. This is the tightest cadence of any archetype,
  directly reflecting the Short Patience Window / high urgency
  established in Section 1 above.

NON-TRIGGERS (specific to Emergency, extending Module 4 Section 2's
universal list):
  - Customer confirms the technician arrived or called ("all set,
    thanks" / "they're here now") — Step 1G End State 1, not eligible.
  - Customer explicitly says they resolved it themselves (DIY branch,
    Section 5, resulted in self-resolution) — respected as a
    deliberate outcome, not an abandoned opportunity.
  - Conversation ended via Mode C escalation (human takes over) —
    per Step 1G End State 5, AI does not create a recovery record
    while human owns it.
  - Out-of-zone conversations (Section 5) — the interaction's job was
    completed honestly; there is no "opportunity" to recover since no
    service was ever offered.
```

---

#### 8. Escalation Boundaries

All triggers with exact agent behavior on detection.

```
TRIGGER: Genuine life-safety hazard (gas, sparking, structural risk)
  Behavior: Immediate safety guidance, parallel data collection,
  Priority 1 escalation (Module 1 D Escalation Priority
  Classification) — supersedes all other logic, no exceptions.

TRIGGER: Complaint / trust-broken signal (Priority 2)
  Behavior: Core Agent Complaint Handler de-escalation sequence
  (Module 1 C) takes the conversation first; safety guidance runs in
  parallel if also applicable, never skipped.

TRIGGER: Confidence Gate (1D.2) returns Low/Conflicting on severity
  classification (agent genuinely cannot tell if this is urgent)
  Behavior: Default toward treating as urgent (per Step 2 Section 2.2
  Risk-Based Freedom Reduction's directional bias — when in doubt,
  treat the higher-stakes case as higher-stakes). Proceed with the
  standard triage sequence rather than the Flag 1 non-emergency
  branch.

TRIGGER: Dispatch/callback queue action fails (Module 3 Section 5
  Failure Handling — "EMERGENCY DISPATCH ACTION FAILS")
  Behavior: Immediate Human Handoff Handler routing at Priority 1,
  explicit customer-facing acknowledgment that a person is being
  brought in directly — never a silent retry.
```

**Human Queue Unavailable (Flag 2 — Appendix B):**

This is the general fallback rule for Priority 1/2 escalation when no human is online, authored here for Emergency and intended for reuse by other archetypes as their Step 4 sections are built.

```
Detection: Escalation triggered (Priority 1 or 2, per Module 1 D)
  but no human agent is currently available in the queue (after-hours,
  all agents at capacity beyond a configured threshold).

Behavior:
  1. Never state "no one is available" and stop — this violates
     Step 0A Emergency's core confidence-building rule (a concrete
     time window, not silence).
  2. If genuine active safety risk (highest-severity branch above):
     provide immediate safety guidance regardless of human
     availability, then queue the escalation at Priority 1 for the
     moment a human comes online. If Business Memory contains a
     configured after-hours emergency contact or instruction (e.g.,
     "if life-threatening, call 911" or a client's own after-hours
     line), surface it — the agent does not withhold a safer
     alternative just because its own queue is unmanned.
  3. If not life-threatening but still Priority 1 (e.g., active water
     damage, no immediate danger): do not promise the standard
     15-minute callback window if no human can actually honor it —
     per the Confidence Gate (1D.2) principle that a wrong confident
     action is worse than a clarification/honest-delay response.
     Communicate the actual next available window instead (e.g.,
     "our on-call technician will reach out as soon as they're
     available — typically by [next realistic time]").
  4. The escalation record is still created immediately (Priority 1
     flag intact) — "unavailable" affects what is communicated to the
     customer, not whether the internal escalation is logged and
     queued.
```

---

## STEP 4 ARCHETYPE 1 (EMERGENCY) COMPLETION SUMMARY

- **Sections completed:** 1. Customer Psychology Summary / 2. Common Entry Scenarios (12 provided, minimum 10 met) / 3. Full Conversation Journey Map / 4. Data Collection Timing / 5. Decision Tree / 6. Conversion Path / 7. Recovery Trigger Moments / 8. Escalation Boundaries
- **Appendix B flags applied:**
  - **Flag 1 (Home services non-emergency flow):** Resolved with an explicit "Non-Emergency / Quote Request" branch (Section 5), routed to Conversion Engine Mode B (Inspection Slot Booking, Section 6) rather than the Callback Queue — this keeps genuinely non-urgent requests inside the Emergency archetype (correct business context) while giving them materially different treatment than an active crisis, without requiring a new archetype.
  - **Flag 2 (Human unavailability):** Resolved with a "Human Queue Unavailable" rule (Section 8), explicitly authored as a general/reusable fallback for Priority 1/2 escalation across all archetypes, not just Emergency — the core principle (never promise a callback window a human can't actually honor; escalation is still logged even if communication is adjusted) is written to generalize.
- **Decisions made:**
  - Treated the "customer acting on behalf of someone else" edge case (Entry Scenario 6) as a first-class Decision Tree branch rather than a footnote, since Emergency's Tier 3-immediate data collection (Section 4) needed explicit handling for whose contact info gets collected when the affected party isn't the one messaging.
  - Positioned the DIY branch (Section 5) as informational-only, never a substitute for the triage question — the agent may answer a safety-relevant DIY question from KB, but this doesn't let the freedom-level-2/10 agent infer the customer has declined professional help.
  - Out-of-zone handling was written to close cleanly at Step 1G End State 1 (not treated as a failed conversion) — an honest "we don't service that area" answer is a completed job, not an abandoned opportunity, and explicitly does not trigger Recovery Engine (Section 7 non-triggers).
- **Open questions:**
  - Section 8's Human Queue Unavailable rule references a "configured after-hours emergency contact or instruction" in Business Memory. — **RESOLVED** — `after_hours_emergency_contact` is already present in Appendix A's Business Config Additions.
  - Flag 1's Inspection Slot Booking assumes the same calendar infrastructure used elsewhere in Conversion Engine (Module 3) is available for Emergency-archetype businesses specifically — architect should confirm Home Services businesses in scope actually have inspection-slot calendar capability configured, or whether this defaults to a simpler request-based flow (Module 3's Request Booking pattern) instead.
  - The "on behalf of someone else" branch allows the caller's own contact number to stand in for the affected party's — architect should confirm this is acceptable across all configurations, or whether some deployments require the affected party's own verified contact before dispatch (ties to Step 3 Module 1's Customer Verification Rule, high-risk-action tier).
- **Ready for architect review:** YES

---

### ARCHETYPE 2 — Commerce Engine (Ecommerce Agentic 3/10 · Restaurant Agentic 2/10)

This section applies the Universal Runtime (Step 1), Freedom Boundary Spec (Step 2), and Service Modules (Step 3) to Commerce's specific customer reality, now built against the hardened Batch 3 foundation — the Module Responsibility Contract (Step 1D.0.5), the Universal Availability Validation Layer (Module 3 §2.1), Universal Mode Naming (Module 3 §2), and Growth Agent (Module 2, renamed from Revenue Agent) are referenced throughout rather than retrofitted. Nothing here overrides those steps — this is archetype-specific configuration and journey built on top of them. Per Step 0A's sub-variant scope clarification (restated in Restaurant §6 below), Ecommerce and Restaurant are built as two fully independent journeys sharing only their parent archetype label; a business with both dine-in reservations and delivery/pickup ordering runs both sub-variants active simultaneously, routed per message.

All 14 design questions flagged as open in the original Execution Plan (8 Ecommerce, 6 Restaurant) are resolved directly within the sections below, and restated as explicit decisions in this archetype's completion summary.

---

## COMMERCE — ECOMMERCE

#### 1. Customer Psychology Summary

Reference: Step 0A Archetype 2 (Commerce), Ecommerce-specific subsections, in full. Restated briefly with runtime implications:

```
Mental state:      Curious-to-motivated, comparing this option against
                    alternatives including doing nothing.
Trust level:       Medium but fragile — rises or collapses in the
                    first 1-2 exchanges.
Buying readiness:  Spans Exploring → Considering → Deciding → Ready →
                    Post-purchase, shifting fastest of any archetype;
                    detected per-message, never assumed linear.
Patience Window:   SHORT (Ready buyer) → MEDIUM (Explorer). Discovery
                    tolerance Low → Medium, stage-dependent.
Relationship/
Transaction:       70% Transaction / 30% Relationship.
Win condition:     "I found exactly what I wanted, I know exactly what
                    I'm paying, and I know what happens if it's wrong.
                    I can buy with one more click."
```

**Runtime implications (what this psychology forces at the architecture level):**
```
- Freedom Level 3/10 (Step 2) means recommendations are offered only
  when explicitly asked, at most one option at a time — the agent
  answers directly (Step 2 §3 worked example: "is it worth it over
  the cheaper one?") rather than volunteering an unsolicited pitch.
- Per-message buying-stage detection (Module 2 §A.0, Growth Buying
  Stage Detection) is not optional here — because readiness "shifts
  fastest of any archetype" (Step 0A), applying yesterday's stage to
  today's message is a direct disengagement trigger.
- Step 0B's Tier 2 (cart-save offer) as primary tier is the direct
  operational consequence of 70% Transaction weighting with a
  fragile-trust opening — asking for contact info before a genuine
  preference is expressed violates "what causes disengagement" (Step
  0A) before trust has had a chance to build.
- No hidden costs (Step 0A "what creates confidence") is a hard
  constraint on Conversion Engine Mode A/B — total cost must be
  stated upfront, never revealed only at checkout.
```

---

#### 2. Common Entry Scenarios

Minimum 10 realistic opening messages, each with what it signals. [Owner tags indicate which module the message routes to per the Module Responsibility Contract, Step 1D.0.5.]

```
1. "Do you have this jacket in medium?"
   Signals: Ready-adjacent, SKU-level. → [Owner: Growth Agent if
   discovery/confirm needed, else Core Agent FAQ if a pure stock
   lookup] → likely Intent 03 shortly after.

2. "What's the difference between this and the cheaper version?"
   Signals: Evaluator stage, explicit request for a recommendation —
   the Freedom 3/10 "recommend only if asked" exception fires (Step 2
   §3 worked example). → [Owner: Growth Agent, Recommendation Flow B]

3. "just looking around, what do you guys sell"
   Signals: Explorer stage, low commitment. → [Owner: Growth Agent,
   Discovery Flow A] — light touch, no contact-info ask, no upsell.

4. "I ordered last week and it hasn't arrived"
   Signals: Post-purchase, Intent 04. → [Owner: Core Agent Support
   Handler, Module 1 B] — NOT a Commerce-archetype flow; see Decision
   Tree §5 Handoff branch (resolves Ecom design question 5).

5. "I want to buy this for my sister, can you ship it straight to her?"
   Signals: Gift purchase, dual contact identity. → [Owner: Conversion
   Engine at Tier 3, once ready] — see Data Collection Timing §4
   (resolves Ecom design question 6).

6. "can I get a discount if I buy two?"
   Signals: Discount/price objection. → [Owner: Growth Agent,
   Objection Handling C] — see Decision Tree §5 (resolves Ecom design
   question 7).

7. "is this actually better than [competitor]'s version"
   Signals: Competitor comparison. → [Owner: Growth Agent, Objection
   Handling C, Competitor subtype] — see Conversion Path §6 example
   (resolves Ecom design question 8).

8. "I want this exact one, size 10, can you just add it to my cart"
   Signals: Ready Buyer, Intent 03 directly. → [Owner: Conversion
   Engine, Mode A/B per config] — no discovery needed (Module 2 EC-01).

9. "does it come in size 10? mine keeps saying sold out online"
   Signals: Potential out-of-stock case. → [Owner: Conversion Engine,
   §2.1 Availability Validation Layer] — see Decision Tree §5 (resolves
   Ecom design question 2).

10. "this cart is $1,800, can someone just call me to sort out delivery
    logistics?"
    Signals: High cart value + explicit human preference. → [Owner:
    Conversion Engine Mode C] — see Decision Tree §5 cart-value branch
    (resolves Ecom design question 4).

11. "I want the jacket AND wondering if you ship internationally?"
    Signals: Purchase intent + a Blocking factual question (per Stress
    Test MI-05) — international shipping must be confirmed from
    Business Memory before conversion proceeds, not guessed.
    → [Owner: Core Agent FAQ fact-check inline, then Conversion Engine]

12. "This is ridiculous, the shirt I got is nothing like the photos"
    Signals: Complaint, Intent 05, Universal Psychology Override. →
    [Owner: Core Agent Complaint Handler, Module 1 C] — Commerce flow
    stands down entirely until resolved.

13. "just want to see what's new this season"
    Signals: Explorer, no specific product yet. → [Owner: Growth
    Agent, Discovery Flow A]

14. "I bought the tent last month, do you have anything that pairs
    with it?"
    Signals: Existing customer + new opportunity — Support →
    Opportunity Detection bridge (Module 1 B.1). → [Owner: Core Agent
    recognizes, then hands to Growth Agent if active]

15. "can you match the price I saw on [competitor]'s site?"
    Signals: Price objection framed as a match request — same no-
    discount-authority handling as Entry Scenario 6, routed through
    Objection Handling's Price type, not treated as a Competitor-type
    objection just because a competitor is named (Module 2 EC-02
    underlying-signal classification).
```

---

#### 3. Full Conversation Journey Map

**Happy path (Ready Buyer, no branches triggered):**
```
Customer message received
↓
1A Session State Check (New / Returning Lead / Existing Customer /
   Dormant Customer)
↓
1B Intent Classification
↓
Intent 04 (Existing Customer Support) detected?
  YES → [Owner: Core Agent, Module 1 B] — full handoff, Commerce
        archetype flow stands down for this conversation (see §5).
  NO  → continue
↓
1D Module Routing — [Owner: Growth Agent (Module 2) if Intent 01/02/08
   and active; Core Agent FAQ Handler only if Growth OFF]
↓
Growth Buying Stage Detection (Module 2 §A.0) — Explorer / Evaluator /
   Ready Buyer, evaluated fresh per message (Step 0A "shifts fastest")
↓
Discovery (if Explorer) → Recommendation (if Evaluator) — [Owner:
   Growth Agent] — Freedom 3/10: recommend only if explicitly asked,
   max one option unless the customer's response invites an
   alternative (Step 2 §3 worked example)
↓
Bundle/Upsell check (Opportunity Detection, Module 2 §E) — [Owner:
   Growth Agent] — see §6 below (resolves Ecom design question 3)
↓
Tier 2 trigger: cart-save offer once genuine preference expressed
   (Step 0B §3, Module 2 §B) — [Owner: Growth Agent]
↓
Buying signal → Intent reclassifies to 03 (Step 1E) → [Owner: hands
   off to Conversion Engine, Module 2 §3]
↓
Cart-value escalation check (archetype-level gate, §6 below) — [Owner:
   Conversion Engine, mode selection] — see Decision Tree §5 (resolves
   Ecom design question 4)
↓
Action Permission Check (1D.1) — "create cart" permission granted?
  YES → Mode A (Agent Cart Creation)
  NO  → Mode B (Guided Product Link)
↓
Availability Validation Layer (Module 3 §2.1) — stock check — [Owner:
   Conversion Engine] — see Decision Tree §5 (resolves Ecom design
   question 2)
↓
Tier 3 data collection — [Owner: Conversion Engine, Module 3 §4]
↓
Cart created / link delivered, total cost confirmed upfront
↓
Step 1G Exit: End State 1 (Successful Completion, Pending until
   payment confirms) or End State 2 (Open Opportunity, Mode B link
   sent, no in-session confirmation)
```

**Branch paths (each detailed fully in §5 Decision Tree):**
```
- Existing-customer support handoff branch (Ecom design question 5)
- Out-of-stock branch (Ecom design question 2)
- Cart-value escalation branch (Ecom design question 4)
- Gift purchase / dual-contact-identity branch (Ecom design question 6)
- Discount request branch (Ecom design question 7)
- Competitor comparison branch (Ecom design question 8)
- Complaint / trust-broken mid-conversion branch
- Conversion Engine OFF fallback branch
```

---

#### 4. Data Collection Timing

Applying Step 0B doctrine and the Step 0B §7 Data Validation Layer specifically to Ecommerce — the first archetype built with validation handling designed in from the start rather than retrofitted.

```
Tier applied: Tier 2 (Value Exchange Capture) primary, Tier 3
  (Commitment Capture) secondary — per Step 0B §4's Per-Archetype
  Collection Mapping Table.

Exact timing:
  1. Tier 2 (cart-save offer): triggered inside Recommendation Flow
     (Module 2 §B) once the customer expresses a genuine preference —
     never before. Field collected: email only (minimum needed for
     that specific value exchange).
  2. Tier 3 (transaction completion): triggered at Conversion Engine
     entry (Module 3 §4) — item/variant/quantity, delivery details if
     applicable. Payment itself is handled by the checkout link's own
     flow, not the agent (Module 3 Ecom Mode A, step 5).

Field validation applied at each Tier 2/3 field per Step 0B §7:
  - Email (Tier 2 cart-save offer, and Tier 3 if different from Tier
    2's): format validation (§7.1) plus typo-correction suggestion
    (e.g., "gmial.com" → "did you mean gmail.com?") before the cart-
    save action fires. A Tier 2 email that fails validation is held at
    NOT-YET-COLLECTED (§7.4) — the cart-save action does not fire on
    an unvalidated address.
  - Name (Tier 3, if required by checkout): validated per §7.1 Name
    rules — accepted freely, only clear non-names rejected.
  - Delivery address fields (Tier 3, if collected by the agent rather
    than the checkout link itself): treated as free-text KB-adjacent
    data, not subject to the structured Email/Phone/Date validators —
    the checkout link's own address-validation (postal service API,
    typically) is the authoritative check; the agent does not attempt
    to validate street addresses itself.
```

**Special case — Gift purchase (dual contact identity, resolves Ecom design question 6):**
```
Both buyer and recipient captures are Tier 3 (Commitment Capture) —
neither is Tier 2, because a gift purchase has already crossed into
transaction-commitment territory by the time recipient details are
needed (the customer has decided to buy; recipient info is a
requirement of completing THIS transaction, not a separate value
exchange).

Order of capture (two distinct moments, never merged into one ask,
per Step 0B's completion-summary resolution of this exact case):
  1. Buyer's info first — name + payment-relevant contact (email or
     phone), framed as completing the buyer's own transaction/receipt:
     "I'll get this set up — what's the best email for your order
     confirmation?"
  2. Recipient's info second, framed as a distinct, clearly-labeled
     step: "And who's this going to? I'll need their name and shipping
     address to get it sent their way."

If the buyer indicates it's a surprise (recipient shouldn't be
contacted directly): recipient's captured contact info (if any, e.g.
an address only) is used strictly for delivery logistics — never for
marketing, recovery messaging, or any outbound contact. Recovery
Engine eligibility (§7 below) attaches to the buyer's record only.
```

**Backend submission gate:** Per Step 0B §7.4, the transition from DATA_COLLECTION to ACTION_PENDING (Module 3 §1.1) does not fire for any Ecommerce conversion until all required Tier 2/3 fields for that specific mode are VALID or INVALID-FLAGGED — a NOT-YET-COLLECTED field (e.g., an unconfirmed recipient address) blocks cart/order submission entirely, consistent with Module 3 §4's existing rule.

---

#### 5. Decision Tree

All conditions with explicit YES/NO branches. No dead ends. [Owner] tags applied per the Module Responsibility Contract (Step 1D.0.5).

```
MESSAGE RECEIVED
↓
IS THIS INTENT 04 (EXISTING CUSTOMER, ORDER ISSUE)? (Ecom design
question 5 — Returning customer with an order issue)
  YES → [Owner: Core Agent Support Handler, Module 1 B] — full
        ownership transfer. This is explicitly NOT a Commerce-
        archetype-specific flow per the Module Responsibility
        Contract's OWNS/MUST TRANSFER split: Growth Agent "DOES NOT
        OWN" resolving complaints/support, Conversion Engine "MUST
        TRANSFER" post-completion modification requests to Core
        Agent. The handoff point is HERE, at intake — before Growth
        Agent or Conversion Engine ever engage, not after a partial
        Commerce flow runs. No parallel support logic is built inside
        this archetype.
  NO  → continue
        ↓
IS THIS A COMPLAINT / TRUST-BROKEN SIGNAL? (Intent 05, Universal
Psychology Override)
  YES → [Owner: Core Agent Complaint Handler, Module 1 C] — Commerce
        flow stands down entirely until resolved; recovery-opportunity
        check only after resolution (Module 1 C).
  NO  → continue
        ↓
DOES THE MESSAGE CONTAIN A FACTUAL BLOCKING QUESTION ALONGSIDE
PURCHASE INTENT? (e.g., international shipping, per Stress Test MI-05)
  YES → [Owner: Core Agent FAQ, inline] — answer from Business Memory
        before conversion proceeds; if KB is silent, Confidence Gate
        (1D.2) routes to clarification, never a guessed answer, per
        Step 0C's "never override business data with assumptions."
  NO  → continue
        ↓
IS THE CUSTOMER A READY BUYER (INTENT 03) ALREADY, OR DOES A BUYING
SIGNAL SURFACE DURING DISCOVERY/RECOMMENDATION?
  NO  → [Owner: Growth Agent] Discovery (A) / Recommendation (B) per
        Buying Stage Detection (§A.0) → continue evaluating each new
        message against this same tree.
  YES → continue
        ↓
IS THIS A DISCOUNT REQUEST? (Ecom design question 7)
  YES → [Owner: Growth Agent, Objection Handling C — Price type] —
        Discount action-level permission (1D.1) granted for this
        deployment?
          NO (default) → Agent: "I don't have discount authority
                myself, but I can flag this for the team — in the
                meantime, here's what makes [item] worth it: [value
                reframe tied to what the customer said they need]."
                → Route to Human Handoff Handler, Priority 3 (Review)
                per Module 1 D — informational/commercial, not urgent.
          YES (configured) → Apply the configured discount action
                through the same permission-gated path (1D.1) — never
                improvised, business-defined discount logic executes,
                Growth Agent does not decide the discount itself.
  NO  → continue
        ↓
IS THIS A COMPETITOR COMPARISON? (Ecom design question 8)
  YES → [Owner: Growth Agent, Objection Handling C — Competitor
        subtype] — value-focused response, cite only confirmed,
        Business-Memory-backed differentiators, never attack the
        competitor (Module 2 §C). Example: "I can't speak to their
        product directly, but here's what's confirmed about ours:
        [specific, KB-backed feature/warranty/material difference]."
        → return to Recommendation Flow or proceed to conversion.
  NO  → continue
        ↓
IS AN UPSELL/BUNDLE MOMENT PRESENT? (Ecom design question 3)
  YES → [Owner: Growth Agent, Opportunity Detection E] — trigger
        requires ALL of: (a) customer already responded positively to
        the primary recommendation, (b) Business Memory contains a
        defined complementary-item mapping for the selected item
        (never a fabricated "customers who bought X also bought Y"
        claim — only KB-confirmed pairings), (c) one-offer-per-
        conversation cap not yet used (Module 2 §E). Offered once,
        framed as optional, never re-offered if declined.
  NO  → continue
        ↓
IS CART VALUE AT OR ABOVE THE CONFIGURED ESCALATION THRESHOLD? (Ecom
design question 4)
  Config field: `cart_value_escalation_threshold` (business-configured
  currency amount; unset = no automatic threshold, Mode A/B proceed
  regardless of value, per the Configuration-First Principle — the
  agent does not decide this for itself).
  YES (threshold configured AND met/exceeded — inclusive boundary,
  consistent with Restaurant's ≥10 party-size precedent and
  Consultation's boundary-rounds-to-higher-stakes rule) →
        [Owner: Conversion Engine, Mode C — Lead Handoff to Human] —
        high-value transactions default to human-assisted completion
        rather than Mode A/B, reflecting the higher service/fraud-risk
        stakes of the amount involved. Priority 2 (Standard) per
        Module 1 D, unless another trigger makes it urgent.
  NO (unset, or below threshold) → continue to standard Mode A/B path.
        ↓
ACTION PERMISSION CHECK (1D.1): "create cart" permission granted?
  YES → Mode A (Agent Cart Creation)
  NO  → Mode B (Guided Product Link) — automatic fallthrough, per
        Module 3 Ecom Mode A step 2, not attempted.
        ↓
AVAILABILITY VALIDATION LAYER (Module 3 §2.1) — Mode A only: does the
cart-creation API confirm stock for the exact item/variant? (Ecom
design question 2 — distinct from a general API error, Module 3 §5)
  YES → Proceed with cart creation.
  NO (out-of-stock specifically, not a general API failure) →
        [Owner: Conversion Engine] — ordered fallback:
          1. Alternative variant/size in stock? → Offer it explicitly,
             disclosing the original is unavailable — never silently
             substitute: "That size just sold out — I don't want to
             assume, but we do have it in [alternative] if that
             works."
          2. No alternative fits, AND
             `backorder_notification_enabled` = true (business
             config)? → Offer a back-in-stock notification, collecting
             Tier 2 contact specifically for that purpose: "I can let
             you know the moment it's back — want me to do that?"
          3. Neither an alternative nor notification capability exists
             → Mode C (Human Handoff), framed around getting a real
             availability/backorder answer, not a generic failure
             message — Priority 3 (Review), not urgent.
  NO (general API error, not stock-specific) → Module 3 §5 CART API
        ERROR handling applies unchanged (fall to Mode B).
↓
IS THIS A GIFT PURCHASE? (Ecom design question 6)
  YES → Dual Tier 3 capture per §4 above (buyer, then recipient,
        separately framed).
  NO  → Standard Tier 3 collection (Module 3 §4 table).
↓
TIER 3 FIELDS VALID OR INVALID-FLAGGED? (Step 0B §7.4 Backend
Submission Gate)
  NO  → Hold at DATA_COLLECTION, apply Correction Flow (§7.3) — one
        flag, one re-attempt, then accept-with-flag.
  YES → Proceed to ACTION_PENDING → CONFIRMED (Module 3 §1.1).
↓
Step 1G Exit
```

---

#### 6. Conversion Path

Full flow for Ecommerce's three Conversion Engine modes (per Step 3 Module 3, applied at the archetype level), presented per the Universal Mode Naming (Batch 3): Agentic Completion (A) / Assisted Capture-or-Guided External Completion (B) / Human Handoff (C).

**Mode A vs. Mode B: both first-class, config-selected (resolves Ecom design question 1).** Per the Runtime Configuration Resolver (Step 1C.0, Batch 3 Patch 3), `conversion_mode = agent_cart | guided_link | lead_handoff` is a deployment-level business decision, not a client-facing quality tier — a business without a cart-creation API integration runs Mode B as its complete, correct, permanent conversion path, exactly as fully as a business running Mode A. Neither mode is presented to the customer as "the real way" with the other as a fallback; the only place Mode A automatically falls to Mode B is the specific, named failure paths (permission not granted, stock unavailable with no alternative and no notification capability, general API error) — never as a default quality assumption.

**Mode A — Agentic Completion (Agent Cart Creation):**
```
Entry: Action Permission Check (1D.1) grants "create cart."
1. Confirm exact item/variant from Session Memory (Growth Agent
   handoff's selected_solution, or collected fresh — Module 2 EC-01).
2. Cart-value escalation check (§5) — below threshold, proceed.
3. Availability Validation Layer (§2.1) — stock confirmed (§5
   out-of-stock branch if not).
4. Call cart-creation API with confirmed item/variant/quantity.
5. On success: present checkout link, confirm total cost upfront —
   no hidden costs (Step 0A "what creates confidence").
6. Collect remaining Tier 3 fields only if checkout requires them
   beyond payment (delivery details, gift recipient per §4).
Exit: Step 1G End State 1 (Pending until payment confirms, per
   Integration Contract Conversion Status).
```

**Mode B — Assisted Capture / Guided External Completion (Guided Product Link):**
```
Entry: "create cart" permission not granted, OR configured as the
   deployment's primary mode (no cart API integration exists).
1. Confirm exact item/variant (as above).
2. Provide a direct, specific link to the product page — never a
   generic category/homepage link (Step 0A "generic responses"
   disengagement trigger).
3. Agent: "Here's the direct link to [item] — everything you need is
   right there, including sizing/options."
Exit: Step 1G End State 2 (Open Opportunity) unless the customer
   confirms in-session completion, in which case End State 1.
```

**Mode C — Human Handoff (Lead Handoff to Human):**
```
Entry: Cart-value escalation threshold met (§5), OR out-of-stock with
   no fallback available (§5), OR Mode A/B both unavailable/failed, OR
   customer explicitly requests a human.
1. Capture Tier 3 fields (name + email or phone) framed as part of
   completing the handoff, not a separate ask.
2. Route to Human Handoff Handler (Module 1 D), Priority 2 (Standard)
   per Module 1's Escalation Priority Classification, unless the
   specific trigger is itself urgent.
Exit: Step 1G End State 5 (Escalated to Human).
```

**Bundle/upsell interplay with Conversion Path (Ecom design question 3):** Opportunity Detection (Module 2 §E) fires inside Growth Agent, before the Intent 03 handoff — never inside Conversion Engine itself, per the Module Responsibility Contract (Conversion Engine "DOES NOT OWN" persuasion; an objection or upsell surfacing mid-conversion re-routes rather than being handled in place). If a bundle opportunity is identified but the customer has already handed off to Conversion Engine (e.g., said "just add the jacket" before Growth Agent's one-offer window closed), the offer is not retroactively inserted into the conversion flow — Growth Agent's one-per-conversation cap is honored by not offering it at all in that case, consistent with "never in the same turn as the primary recommendation" (Module 2 §B) extended to "never inside an already-handed-off conversion."

**Competitor comparison in Ecom context (Ecom design question 8, worked example):**
```
Customer: "is this actually better than [competitor]'s version"
Agent: "I can't speak to their product directly, but here's what's
confirmed about ours: [specific feature/material/warranty difference
drawn from Business Memory]. If [the specific factor] matters most to
you, that's the deciding point."
```
This is the same pattern already defined in Module 2 §C (Objection Handling, Competitor subtype), shown here in the Ecom-specific context per this build's requirement — no new response logic is introduced.

---

#### 7. Recovery Trigger Moments

Exact triggers and non-triggers, per Module 4 applied specifically to Ecommerce. This section uses Module 4's existing trigger definitions and cadence profile — it does not redefine Recovery Engine behavior.

```
RECOVERY TRIGGER (exact moment, per Module 4 §2):
  Conversation ends after a recommendation/cart action, no purchase
  confirmed. OR: Cart link sent (Mode A/B), no purchase confirmation
  received.

RECOVERY PROFILE: Commerce (Ecom) — 30 min → 24 hr → 72 hr, 3 steps,
  per Module 4 §3. Short window reflecting Step 0A Commerce's
  Short→Medium Patience Window.

Tone: Helpful, specific to the item/cart — never discount-baiting
  unless a discount action is separately authorized (per Module 4 §4
  and this build's Decision Tree §5 discount-request resolution —
  Recovery is not a backdoor around the no-discount-authority rule).

ARCHETYPE-SPECIFIC APPLICATION NOTES (using, not extending, Module 4):
  - Gift purchase (§4 above): recovery eligibility and messaging
    attach to the buyer's record only, per §4's explicit rule — the
    recipient's captured info is never used as a recovery contact
    point, consistent with Step 0C §4 Privacy Boundaries.
  - Mode C (cart-value escalation, or out-of-stock with human handoff):
    Step 1G End State 5 — per Module 4 §2's non-trigger list, AI does
    not create a recovery record while a human owns the conversation.
  - Out-of-stock with a back-in-stock notification accepted (§5): this
    is NOT a Recovery Engine case — the notification itself is the
    follow-up mechanism; creating a parallel Recovery Engine cadence
    on top of an accepted back-in-stock notification would be a
    duplicate-contact problem (Module 3 §1.2 Duplicate Action
    Protection principle, applied here to follow-up mechanisms rather
    than conversion actions).

NON-TRIGGERS (specific to Ecom, extending Module 4 §2's universal list
  with archetype application, not new rules):
  - Customer declines outright ("not interested") — Step 1G End State
    1 close, not an open opportunity (Module 2 Recommendation Flow).
  - Customer already converted in the same session, even if an earlier
    unresolved interest (e.g., asked about two products, bought one)
    went unaddressed — Module 4 §2 non-trigger list and EC-02 govern;
    the unresolved interest does not spawn its own recovery record.
```

---

#### 8. Escalation Boundaries

All triggers with exact agent behavior on detection, applying Module 1's existing Escalation Priority Classification (P1/P2/P3) — not reinvented here.

```
TRIGGER: Complaint / trust-broken signal (Intent 05)
  Behavior: Core Agent Complaint Handler (Module 1 C) takes the
  conversation first; Commerce flow stands down. Priority per Module
  1 D's existing classification (typically P1 if severe/distressed,
  P2 if standard).

TRIGGER: Cart-value escalation threshold met (§5)
  Behavior: Mode C, Priority 2 (Standard) per Module 1 D — a
  high-value transaction is commercially significant but not urgent
  by default; if the specific request carries its own urgency (e.g.,
  "I need this shipped today"), that urgency is evaluated
  independently and may raise the priority.

TRIGGER: Out-of-stock with no alternative and no notification
  capability, Mode C fallback (§5)
  Behavior: Priority 3 (Review) per Module 1 D — an availability
  question is not time-critical to the business, even though it is
  disappointing to the customer; framed with the Universal reasoning
  requirement (Module 3 §5) so the customer understands why they're
  being handed off, not just that they are.

TRIGGER: Discount request beyond the agent's authority (§5)
  Behavior: Priority 3 (Review) per Module 1 D — informational/
  commercial, not urgent; the value-reframe response is delivered
  immediately regardless of escalation priority (the customer is never
  left with only "someone will get back to you").

TRIGGER: Confidence Gate (1D.2) returns Low/Conflicting on a factual
  Blocking question (e.g., "do you ship internationally") that gates
  purchase completion
  Behavior: Per Step 0C ("never override business data with
  assumptions"), the agent does not guess. Clarification attempt (max
  2, Module 1 A) then Human Handoff Handler at Priority 3 unless the
  customer signals the purchase is time-sensitive, in which case
  Priority 2.

TRIGGER: Availability Validation Layer failure that also fails Mode B
  (e.g., product page itself references the same unavailable stock)
  Behavior: Per Module 3 §5's universal reasoning requirement, Mode C
  with an explicit, honest reason — never a silent retry or a
  confirmation-sounding message for an incomplete action (Module 3 §5
  Universal failure rule).
```

---

**Ecommerce — Design Decisions Summary (all 8 resolved):**
```
1. Mode A/Mode B parallel, config-selected — §6, no primary/fallback
   framing; `conversion_mode` config already existed in Module 3, this
   build clarifies its parity explicitly.
2. Out-of-stock — new 3-step ordered fallback (alternative → back-in-
   stock notification if `backorder_notification_enabled` → Mode C),
   distinct from general API error — §5, §6.
3. Bundle/upsell — Opportunity Detection triggers only on a KB-
   confirmed complementary-item mapping (never fabricated "others
   bought"), one-per-conversation cap honored across the Growth→
   Conversion handoff boundary — §5, §6.
4. Cart-value escalation — new config field
   `cart_value_escalation_threshold` (unset = no gate, business
   decides), inclusive boundary at the threshold — §5.
5. Existing-customer order issue — handoff point is at Intent
   Classification/intake, before Growth or Conversion Engine ever
   engage; no parallel support logic built in Commerce — §5 (first
   branch).
6. Gift purchase — both buyer and recipient capture are Tier 3, two
   distinct, separately-framed moments, buyer first — §4.
7. Discount request — always routes through the 1D.1 discount
   permission check; default (no permission) is value-reframe + P3
   escalation — §5.
8. Competitor comparison — Module 2 §C's existing value-focused,
   never-attack pattern, shown in Ecom-specific worked example — §6.
```

---

## COMMERCE — RESTAURANT

#### 1. Customer Psychology Summary

Reference: Step 0A Archetype 2 (Commerce), Restaurant-specific subsections, in full. Restated briefly with runtime implications:

```
Mental state:      Planning-oriented, time-anchored — usually a
                    specific occasion in mind (tonight, this weekend,
                    a group event).
Trust level:       Medium but fragile, same as Ecom.
Buying readiness:  Same full-range spectrum as Ecom, but logistics
                    (availability, party size, timing) weigh as
                    heavily as the food itself.
Patience Window:   SHORT → MEDIUM, discovery tolerance Low → Medium.
Relationship/
Transaction:       50% Transaction / 50% Relationship — hospitality
                    expectations carry as much weight as booking
                    mechanics.
Win condition:     "My reservation is locked in, they know about
                    [special request], and I don't have to think about
                    it again until I arrive."
```

**Runtime implications (what this psychology forces at the architecture level):**
```
- Freedom Level 2/10 (Step 2) — a fixed confirm-sequence with zero
  deviation-from-script authority (Step 2 §3 worked example: a custom
  tasting-menu request is routed to a human, not attempted). This is
  tighter than Ecom's 3/10 despite the higher Relationship weighting,
  because a reservation is a single, high-stakes, non-reversible
  commitment (a wrong table/time is a failed occasion, not a
  returnable item).
- Explicit confirmation language ("you're confirmed for 7:30, table
  for 4") rather than soft language is a hard requirement (Step 0A
  "what creates confidence") — directly shapes every Mode A/B/C
  confirmation message below.
- Step 0B's Tier 3 (reservation confirmation) as primary tier — unlike
  Ecom's Tier 2-primary — is the direct consequence of a reservation
  requiring a name to hold the table; there is no lower-commitment
  value-exchange moment that precedes it the way a cart-save does for
  Ecom.
- 50/50 Relationship weighting means the agent must explicitly
  acknowledge occasion context (birthday, anniversary) when given —
  silently processing it as a generic booking is a disengagement
  trigger (Step 0A "any sign the agent didn't register details already
  given").
```

---

#### 2. Common Entry Scenarios

Minimum 10 realistic opening messages, each with what it signals.

```
1. "Table for 4 tonight at 8?"
   Signals: Ready Buyer, Intent 03 directly. → [Owner: Conversion
   Engine, Reservation Flow] — no discovery needed.

2. "What's good here for a birthday dinner for 6?"
   Signals: Occasion-aware, needs recommendation + logistics together.
   → [Owner: Growth Agent for recommendation, then Conversion Engine
   for booking] — occasion context carried forward into confirmation
   (Step 0A 50/50 weighting).

3. "do you have anything for a party of 14 next Saturday?"
   Signals: Large party, exceeds threshold. → [Owner: Conversion
   Engine, Mode C — Event/Catering Handoff] — see Decision Tree §5.

4. "can I get a table for 8:30, oh wait I mean it's already 9 here"
   Signals: Time-already-passed correction needed. → [Owner:
   Conversion Engine] — see Decision Tree §5.

5. "does the salmon dish have shellfish in it, I have a serious
   allergy"
   Signals: Safety-relevant dietary restriction, possibly not in KB.
   → [Owner: Core Agent FAQ if confirmed in KB, else Conversion Engine
   escalation branch] — see Decision Tree §5 (Restaurant design
   question 3).

6. "do you have good vegan options?"
   Signals: Preference-only dietary question, not safety-relevant. →
   [Owner: Core Agent FAQ / Growth Agent if recommendation-adjacent]

7. "I know you're full at 7 but can you put me on a list in case
   something opens up?"
   Signals: Waitlist request. → [Owner: Conversion Engine, Mode B] —
   see Decision Tree §5 (Restaurant design question 4).

8. "we're planning a company holiday party for 40 people in December"
   Signals: Private event/catering inquiry. → [Owner: Conversion
   Engine, Mode C] — see Decision Tree §5 (Restaurant design question
   5).

9. "can you deliver a catering order to my office tomorrow?"
   Signals: Delivery/order intent, NOT a reservation — scope boundary
   check. → [Owner: routes to Ecommerce sub-variant if configured, or
   states delivery isn't offered if not] — see §6 (Restaurant design
   question 6).

10. "I need to change my reservation from 6pm to 7pm"
    Signals: Existing reservation modification, Intent 04. → [Owner:
    Core Agent Support Handler, Module 1 B, per Module 3 EC-07] — NOT
    handled by Conversion Engine re-running its own flow.

11. "we came in last week and the service was terrible"
    Signals: Complaint, Intent 05, Universal Psychology Override. →
    [Owner: Core Agent Complaint Handler, Module 1 C]

12. "is this place fancier than [nearby restaurant]?"
    Signals: Comparison, less common in Restaurant than Ecom but
    handled identically — Objection Handling Competitor subtype. →
    [Owner: Growth Agent, if active]

13. "table for 2, we come here every Friday"
    Signals: Returning customer, existing pattern (Customer Memory) —
    booking proceeds normally; per Step 0C, current availability
    (Business Memory) always overrides an assumption that "every
    Friday" pattern guarantees a table.

14. "can I book the private room for a proposal, need it to be
    perfect"
    Signals: High-stakes occasion + possibly a private-event-adjacent
    request. → [Owner: Conversion Engine — Mode A if within standard
    party size and the private room is a standard bookable feature, or
    Mode C if it requires event-team coordination] — occasion
    sensitivity (Step 0A "what creates confidence") shapes tone
    regardless of which mode applies.

15. "just checking what your hours are for Sunday"
    Signals: Pure informational, Intent 01. → [Owner: Core Agent FAQ
    Handler]
```

---

#### 3. Full Conversation Journey Map

**Happy path (standard reservation, no branches triggered):**
```
Customer message received
↓
1A Session State Check
↓
1B Intent Classification
↓
Intent 04 (existing reservation modification)? — [Owner: Core Agent
   Support Handler, Module 1 B, per Module 3 EC-07] — full handoff,
   Conversion Engine does not re-run its own flow to handle a
   modification of an already-confirmed booking.
  YES → handoff, exit this map.
  NO  → continue
↓
Scope boundary check: is this actually a delivery/pickup/catering-
   order request, not a reservation? (Restaurant design question 6,
   §6 below)
  YES → route to Ecommerce sub-variant (if configured) or state
        plainly that delivery isn't offered (if not).
  NO  → continue
↓
Complaint / trust-broken signal? (Intent 05)
  YES → [Owner: Core Agent Complaint Handler, Module 1 C]
  NO  → continue
↓
1D Module Routing — [Owner: Growth Agent if Intent 01/02 and an
   occasion/recommendation question is present and active; Core Agent
   FAQ Handler for pure informational questions]
↓
Party size, date, time confirmed or collected (Tier 3, Step 0B §4)
↓
Party size ≥ 10? (already defined in Module 3, shown in full context
   §5/§6 below)
  YES → Mode C (Event/Catering Handoff)
  NO  → continue
↓
Requested time already passed? (already defined in Module 3, shown in
   full context §5/§6 below)
  YES → natural correction prompt, return to time confirmation.
  NO  → continue
↓
Dietary restriction mentioned, and not confirmable from Business
   Memory? (Restaurant design question 3, new — §5 below)
  YES → safety-relevant branch or preference-only branch, per §5.
  NO  → continue
↓
Availability Validation Layer (Module 3 §2.1) — table/slot check
↓
Slot available?
  YES → Mode A (Reservation Flow, direct) — Tier 3 name collected,
        booking_status = "Confirmed" stated explicitly.
  NO  → waitlist_enabled config check (Restaurant design question 4)
        YES → Mode B (Waitlist Entry)
        NO  → offer nearest actually-available alternative time.
↓
Step 1G Exit: End State 1 (Confirmed) or End State 2 (Waitlisted /
   Open Opportunity)
```

**Branch paths (each detailed fully in §5 Decision Tree):**
```
- Existing-reservation modification handoff branch
- Scope boundary (delivery/catering-order vs. reservation) branch
- Party size ≥ 10 branch (Event/Catering Handoff)
- Time-already-passed correction branch
- Dietary restriction not in KB branch
- Waitlist branch (config-dependent)
- Private event/catering inquiry branch
- Complaint / trust-broken mid-flow branch
```

---

#### 4. Data Collection Timing

Applying Step 0B doctrine and the Step 0B §7 Data Validation Layer specifically to Restaurant.

```
Tier applied: Tier 3 (Commitment Capture) primary, Tier 1 (Passive
  Capture) secondary — per Step 0B §4's Per-Archetype Collection
  Mapping Table.

Exact timing:
  1. Tier 3 (name, required to hold the table): collected at the
     reservation confirmation step — not before, since nothing about
     browsing availability requires a name.
  2. Tier 1 (email/phone, if volunteered earlier for an unrelated
     question, e.g. a menu question): captured passively, not
     re-asked at Tier 3 unless the specific field (name) wasn't part
     of what was volunteered — email and name are different fields,
     so no conflict (per Step 0B's own confirmed non-conflict
     resolution).

Special requests (allergy, accessibility, occasion) are collected
  alongside the Tier 3 moment, not as a separate ask (Step 0B §4
  Special Rules) — bundled into the same confirmation exchange:
  "I'll get you a table for 4 at 7:30 — anything I should note, like
  an allergy or a special occasion?"

Field validation applied per Step 0B §7:
  - Name: validated per §7.1 Name rules.
  - Date/Time: validated per §7.1 Date/Time rules — past-date and
    impossible-date handling directly implements the Decision Tree's
    "time already passed" branch (§5/§6) and Module 3's existing
    Reservation Flow step 3.
  - Phone (if collected, e.g. for a waitlist entry or a callback if
    the slot opens): validated per §7.1/§7.2 as in any other
    archetype.
```

**Backend submission gate:** Per Step 0B §7.4, the reservation is not submitted (calendar_event_id created) until Tier 3 fields are VALID or INVALID-FLAGGED — a NOT-YET-COLLECTED name blocks the booking action, consistent with Module 3 §4.

---

#### 5. Decision Tree

All conditions with explicit YES/NO branches. No dead ends. [Owner] tags applied per the Module Responsibility Contract (Step 1D.0.5).

```
MESSAGE RECEIVED
↓
IS THIS A MODIFICATION OF AN EXISTING, ALREADY-CONFIRMED RESERVATION?
  YES → [Owner: Core Agent Support Handler, Module 1 B, per Module 3
        EC-07] — full handoff. Conversion Engine does not attempt to
        handle its own modification after the exit condition already
        fired for the original booking.
  NO  → continue
        ↓
IS THIS ACTUALLY A DELIVERY/PICKUP/CATERING-ORDER REQUEST, NOT A
RESERVATION? (Restaurant design question 6 — Scope boundary reminder)
  YES → Per Step 0A's explicit sub-variant scope clarification:
        delivery/pickup/bakery-style order businesses are OUT of
        Restaurant's scope entirely — they map to the Ecommerce
        sub-variant, since the actual interaction pattern is cart/
        order/checkout, not table booking. Two sub-cases:
          (a) This business ALSO has Ecommerce sub-variant active
              (e.g., a restaurant with both dine-in and delivery) →
              [Owner: routes to Ecommerce sub-variant's own Decision
              Tree/Conversion Path] — no reservation-style logic
              (party size, table time, seating) is ever applied to
              this request.
          (b) This business does NOT have Ecommerce active (dine-in
              only) → [Owner: Core Agent FAQ] — state plainly:
              "We don't offer delivery/catering-to-go directly — I can
              get you set up with a reservation to dine in, if that
              works." Never silently attempt to force a delivery
              request into the reservation flow.
  NO  → continue
        ↓
IS THIS A COMPLAINT / TRUST-BROKEN SIGNAL? (Intent 05)
  YES → [Owner: Core Agent Complaint Handler, Module 1 C]
  NO  → continue
        ↓
IS PARTY SIZE ≥ 10? (Already defined in Module 3, shown in full
conversational context here per this build's requirement)
  YES → [Owner: Conversion Engine, Mode C] — Agent: "For parties of 10
        or more we handle it through our events team so we can get you
        properly set up" (Module 3 Restaurant Reservation Flow step 2)
        — plain explanation, not a silent decline. Priority 2
        (Standard) per Module 1 D unless the event date is imminent.
  NO  → continue
        ↓
HAS THE REQUESTED TIME ALREADY PASSED? (Already defined in Module 3,
shown in full conversational context here)
  YES → [Owner: Conversion Engine] — Agent: "Just to check — did you
        mean tonight, or [next occurrence of that time]?" (Module 3
        Restaurant Reservation Flow step 3) — return to party
        size/date/time confirmation with the corrected time, not a
        robotic rejection.
  NO  → continue
        ↓
DOES THE CUSTOMER MENTION A DIETARY RESTRICTION NOT CONFIRMABLE FROM
BUSINESS MEMORY? (Restaurant design question 3 — genuinely open,
resolved here)
  Apply Step 0C Level 3 principle: never override business data with
  assumptions. The answer follows directly from that — the agent does
  not guess, in either sub-case below, but the severity of the
  response differs by stakes:

  IS IT SAFETY-RELEVANT (allergy, medical dietary restriction)?
    YES → [Owner: Core Agent, escalation path] — Agent: "I don't have
          that confirmed in what I have access to, and I don't want to
          guess on something like this — I'll flag it so the kitchen
          team can confirm directly before you arrive." Priority 2
          (Standard) per Module 1 D — not Priority 1 (no active,
          happening-now danger, unlike Emergency's life-safety trigger)
          but escalated with enough urgency that it is confirmed
          BEFORE arrival, not passively logged. The reservation record
          carries a validation_flag-equivalent note (per Step 0B §7.4
          pattern, applied to a KB-gap rather than a malformed field)
          requiring human confirmation prior to service.
    NO (preference-only — vegan, vegetarian, no allergy involved) →
          [Owner: Core Agent, informational] — Agent: "I don't have
          that confirmed on our current menu, but I'll note it so the
          team can accommodate or confirm when you arrive." Priority 3
          (Review) — attached to the reservation as a note, not an
          urgent escalation; consistent with the directional bias
          established elsewhere in this document (Module 3's "when in
          doubt, treat the higher-stakes case as higher-stakes") —
          safety gets Priority 2, preference gets Priority 3, the same
          case is never treated identically regardless of stakes.
  NO (KB confirms the answer) → [Owner: Core Agent FAQ] — answer
        directly, no escalation needed.
  ↓
IS THIS A PRIVATE EVENT / CATERING INQUIRY? (Already defined in Module
3 as routing to Mode C, shown in full conversational context here)
  YES → [Owner: Conversion Engine, Mode C] — Agent acknowledges
        specifically (Step 0A "what creates confidence"), captures
        Tier 3 fields, routes to Human Handoff Handler, Priority 2
        (Standard) unless the event date is imminent (Module 3
        Restaurant Event/Catering Handoff).
  NO  → continue
        ↓
AVAILABILITY VALIDATION LAYER (Module 3 §2.1): is a table/slot
available at the requested time?
  YES → Mode A (Reservation Flow, direct) — confirm explicitly
        ("you're confirmed for 7:30, table for 4").
  NO  → `waitlist_enabled` config flag true? (Restaurant design
        question 4 — already gated in Module 3, shown in full
        conversational context here)
          YES → Mode B (Waitlist Entry) — Agent: "I don't have that
                exact time, but I can add you to the waitlist and
                reach out if it opens up — want me to do that?" Tier 3
                fields collected as part of the waitlist entry.
          NO  → State unavailability plainly, offer the nearest
                actually-available alternative time instead of a
                waitlist (Module 3 Restaurant Waitlist Entry, explicit
                false-branch behavior).
↓
Step 1G Exit
```

---

#### 6. Conversion Path

Full flow for Restaurant's three Conversion Engine modes (per Step 3 Module 3, applied at the archetype level), presented per the Universal Mode Naming (Batch 3): Agentic Completion (A) / Assisted Capture-or-Guided External Completion (B) / Human Handoff (C).

**Mode A — Agentic Completion (Reservation, direct):**
```
Entry: Party size < 10, requested time in the future, table/slot
   available (§5 checks all passed).
1. Confirm party size, date, time from Session Memory/handoff or
   collect fresh.
2. Availability Validation Layer (§2.1) confirms the slot.
3. Collect Tier 3 name + any special request, bundled (§4).
4. Create calendar_event_id (Integration Contract Calendar Standards),
   state booking_status = "Confirmed" explicitly: "You're confirmed
   for 7:30, table for 4 — I've noted the birthday, we'll take care of
   it."
Exit: Step 1G End State 1.
```

**Mode B — Assisted Capture (Waitlist Entry):**
```
Entry: No slot available at requested time, AND `waitlist_enabled` =
   true (Restaurant design question 4).
1. Offer waitlist explicitly (§5).
2. If accepted, collect Tier 3 fields (name + contact) as part of the
   waitlist entry itself.
3. If `waitlist_enabled` = false: state unavailability plainly, offer
   the nearest actually-available alternative time instead — this is
   the explicit false-branch behavior, not silence.
Exit: Waitlisted → Step 1G End State 2 (Open Opportunity, Recovery
   Engine evaluates per §7 below). Alternative time accepted → Mode A.
```

**Mode C — Human Handoff (Event/Catering Handoff):**
```
Entry: Party size ≥ 10 (§5), OR explicit private event/catering
   inquiry (§5), OR a genuinely safety-relevant dietary restriction
   requiring pre-arrival kitchen confirmation that the agent cannot
   resolve itself (§5).
1. Acknowledge specifically — not a generic decline (Step 0A "what
   creates confidence").
2. Capture Tier 3 fields as part of the handoff.
3. Route to Human Handoff Handler, Priority 2 (Standard) — not urgent
   unless the event date is imminent or the dietary matter is
   time-sensitive (reservation is today/tomorrow).
Exit: Step 1G End State 5.
```

**Scope boundary in the Conversion Path (Restaurant design question 6, confirmed):** None of the three modes above ever execute for a delivery/pickup/catering-order request — per §5's scope-boundary branch, that request either routes entirely to the Ecommerce sub-variant's own Conversion Path (cart/order logic) or is declined plainly if no Ecommerce capability exists for this business. This build does not construct a fourth Restaurant mode for delivery, because delivery was never in Restaurant's scope to begin with (Step 0A).

---

#### 7. Recovery Trigger Moments

Exact triggers and non-triggers, per Module 4 applied specifically to Restaurant. This section uses Module 4's existing trigger definitions and cadence profile — it does not redefine Recovery Engine behavior.

```
RECOVERY TRIGGER (exact moment, per Module 4 §2):
  Conversation ends after availability discussion or waitlist entry,
  no reservation confirmed.

RECOVERY PROFILE: Commerce (Restaurant) — 1 hr → 24 hr, 2 steps, per
  Module 4 §3. Shortest cadence of any non-Emergency archetype,
  reflecting that reservation timing is date-specific and goes stale
  fast (Module 4 §3's own stated reasoning).

Tone: Warm, low-pressure invitation to confirm — never a reminder that
  frames the customer as having failed to book (Module 4 §4 tone
  rules, applied consistently here — Module 4 does not define a
  Restaurant-specific tone variant beyond what's already in the
  Commerce row).

ARCHETYPE-SPECIFIC APPLICATION NOTES (using, not extending, Module 4):
  - Waitlist entries (§6 Mode B) are explicitly Recovery-eligible per
    Module 3's own Waitlist Entry exit condition ("Step 1G End State 2
    ... Recovery Engine may evaluate per Step 3 Module 4") — this
    build confirms that connection is honored, not re-defines it.
  - Mode C (event/catering handoff, party ≥10, or safety-relevant
    dietary escalation): Step 1G End State 5 — no recovery record
    created while a human owns the conversation (Module 4 §2
    non-trigger list).
  - Time-already-passed corrections (§5) that resolve successfully
    within the same conversation are not a recovery-eligible moment at
    all — the conversation continues to a normal Mode A/B/C outcome;
    only a genuine end-without-confirmation triggers recovery.
```

**Non-triggers (specific to Restaurant, extending Module 4 §2's universal list with archetype application only):**
```
- Delivery/catering-order requests routed to the Ecommerce sub-variant
  (§5/§6 scope boundary) — recovery eligibility for those follows the
  Ecommerce sub-variant's own trigger definition (§7 above in that
  section), not Restaurant's.
- Customer explicitly declines the offered alternative time or
  waitlist ("no thanks, I'll try somewhere else") — Step 1G End State
  1 close, a deliberate decision respected, not an open opportunity.
```

---

#### 8. Escalation Boundaries

All triggers with exact agent behavior on detection, applying Module 1's existing Escalation Priority Classification (P1/P2/P3) — not reinvented here.

```
TRIGGER: Complaint / trust-broken signal (Intent 05)
  Behavior: Core Agent Complaint Handler (Module 1 C) takes the
  conversation first; Commerce flow stands down. Priority per Module
  1 D's existing classification.

TRIGGER: Party size ≥ 10 (§5, §6)
  Behavior: Mode C, Priority 2 (Standard) — commercially significant,
  time-sensitive only if the event date is imminent.

TRIGGER: Safety-relevant dietary restriction not confirmable from
  Business Memory (§5 — Restaurant design question 3)
  Behavior: Priority 2 (Standard), escalated for pre-arrival kitchen
  confirmation — deliberately one tier above the preference-only
  dietary case (Priority 3), reflecting the directional bias
  established elsewhere in this document: when genuinely in doubt
  between two stakes levels, treat the higher-stakes case as
  higher-stakes.

TRIGGER: Preference-only dietary question not confirmable from
  Business Memory (§5)
  Behavior: Priority 3 (Review) — noted on the reservation, not
  escalated urgently.

TRIGGER: Private event/catering inquiry (§5, §6)
  Behavior: Mode C, Priority 2 (Standard) unless the event date is
  imminent, in which case Priority 1 per Module 1 D's own examples
  ("urgent operational failure... time-sensitive").

TRIGGER: Confidence Gate (1D.2) Low/Conflicting on availability itself
  (e.g., calendar system returns an ambiguous result)
  Behavior: Per Module 3 §5 (Calendar/Registration System Unavailable),
  single retry, then fall to Mode B or C — never a confident-sounding
  confirmation of an uncertain slot (Module 3 §5 Universal failure
  rule).
```

---

**Restaurant — Design Decisions Summary (all 6 resolved):**
```
1. Party size ≥ 10 threshold — shown in full conversational context
   (§3, §5, §6); Module 3's existing rule applied, not altered.
2. Time-already-passed handling — shown in full conversational context
   (§3, §5, §6); Module 3's existing rule applied, not altered.
3. Dietary restriction not in KB — new resolution: safety-relevant
   (allergy) → Priority 2 escalation, pre-arrival kitchen confirmation
   required, never guessed; preference-only (vegan/vegetarian) →
   Priority 3, noted on the reservation. Directly follows Step 0C
   Level 3's "never override business data with assumptions" — §5, §8.
4. Waitlist (config-gated) — shown in full conversational context
   including the `waitlist_enabled` = false case (§5, §6); Module 3's
   existing rule applied, not altered.
5. Private event/catering inquiry — shown in full conversational
   context (§5, §6); Module 3's existing Mode C routing applied, not
   altered.
6. Scope boundary — confirmed delivery/pickup/bakery-style businesses
   are Ecommerce-scope, not Restaurant-scope, per Step 0A's existing
   clarification; new explicit Decision Tree branch (§5) ensures no
   reservation-style logic is ever applied to a delivery/order request,
   with correct routing for businesses running both sub-variants.
```

---

## STRESS-TEST CROSS-CHECK (Commerce)

Required before completion, per Step4_Commerce_Instructions.md. Every existing stress-test case that references Commerce (`Stress_Test_Library_v1.md` Sections 1, 2.2, 4, 5) is walked through against the Decision Trees and Journey Maps built above.

```
U-01/U-02/U-03/U-04/U-08 (Section 1.1, Customer Behavior Matrix):
  Intent 01/02/03/04/08 routing — satisfied directly. Intent 04 is the
  first branch checked in both Decision Trees (§5), routing to Core
  Agent before any Commerce-specific logic runs, per the Module
  Ownership Contract. Intent 08 (competitor/objection) is satisfied by
  the Discount Request and Competitor Comparison branches (Ecom §5,
  §6) and is explicitly the same pattern in Restaurant via reference.

IS-04 (Restaurant reservation flow, Supporting-priority price question
  mid-booking):
  Satisfied by reference — this is a Step 1E/1F universal priority-
  system behavior (Priority 4 in-progress not interrupted by a
  Supporting Priority 5 component), not something the Restaurant
  Decision Tree needed to re-derive. Nothing in this build's Journey
  Map (§3) blocks or contradicts that universal behavior; the
  Reservation Flow (§6 Mode A) proceeds through its fixed sequence
  exactly as the universal rule expects, with an inline answer for a
  Supporting-class question.

MI-05 (Ecom jacket purchase + international shipping factual
  question):
  Satisfied explicitly — this exact scenario is Ecom Entry Scenario 11
  and its own Decision Tree branch ("Does the message contain a
  factual Blocking question alongside purchase intent?"), §5.

Section 2.2 (Commerce Configuration Combination Table, Config A/B/C):
  Confirmed consistent — Config A's fallback message, Config B's
  discovery-without-execution boundary, and Config C's "discount
  authority still gated" note all match this build's Conversion Path
  (§6) and discount-request resolution (Ecom §5) without contradiction.
  No archetype-specific behavior built here overrides any config-level
  boundary already defined.

CM-07 (Commerce recovery cadence outside send window):
  Satisfied by reference — this build's Recovery Trigger Moments
  sections (Ecom §7, Restaurant §7) use Module 4's cadence and
  suppression rules unmodified; Module 4 §3.1's send-window holding
  behavior applies identically regardless of anything defined here.

RT-01 (angry customer mid-flow, including mid-Conversion-Engine
  booking):
  Satisfied — both Decision Trees (§5) check for Intent 05/Universal
  Psychology Override early and per-message (not only at conversation
  start), consistent with RT-01's expectation that a complaint
  preempts an in-progress booking flow.

RT-07 (duplicate action — "book it" / "add to cart" sent twice):
  Satisfied by reference — Module 3 §1.2 Duplicate Action Protection
  applies unmodified to both Ecom cart creation (Mode A) and Restaurant
  reservation creation (Mode A); this build's Conversion Path sections
  (Ecom §6, Restaurant §6) do not alter or bypass that check.

RT-13 (concurrent sessions, differing intents):
  Satisfied by reference — Step 1A's Concurrent Session Deduplication
  Rule is a universal runtime behavior; nothing in either Commerce
  Decision Tree changes how a second, differently-intended session is
  handled.

RT-14 / DV-01 / DV-03 / DV-04 (invalid or insisted-invalid data —
  phone letters, insisted-bad email, ambiguous-region phone format):
  Satisfied by reference — both Data Collection Timing sections (Ecom
  §4, Restaurant §4) apply Step 0B §7's validation, correction-flow,
  and country-code rules unmodified to every Tier 2/3 field collected
  in Commerce, including the gift-recipient and waitlist-contact
  fields introduced by this build.

DV-02 (relative-date resolution, e.g. "next Tuesday"):
  This is a pre-existing, already-documented open gap at the Step 0B
  layer (Stress Test Library Open Gap 6) — natural-language relative-
  date resolution happens upstream of Step 0B §7's format/range
  validation, and the boundary between the two is not drawn anywhere
  in the document, for any archetype. Restaurant's date collection
  (§4, §5) is exactly as exposed to this gap as Appointment's or any
  other archetype's — but resolving it would mean redefining Step 0B
  itself, which is out of scope for an archetype-level build (per this
  task's Rule 4: reference, don't redefine, existing content). Not a
  new gap this build reveals; restated for completeness, left with
  Step 0B as its owner.
```

**Result:** No new, previously-undiscovered gap was found that this Commerce build fails to cover. One pre-existing, cross-archetype gap (DV-02) is confirmed to also apply to Restaurant, but its ownership remains Step 0B, consistent with how the same gap already applies to every other date-collecting archetype without requiring each archetype's Step 4 build to re-solve it individually.

---

## STEP 4 ARCHETYPE 2 (COMMERCE) COMPLETION SUMMARY

- **Sub-variants completed:** Ecommerce (1. Customer Psychology Summary / 2. Common Entry Scenarios [15] / 3. Full Conversation Journey Map / 4. Data Collection Timing / 5. Decision Tree / 6. Conversion Path / 7. Recovery Trigger Moments / 8. Escalation Boundaries) and Restaurant (same 8 sections, Entry Scenarios [15]) — both built to full depth, neither treated as a light variant of the other, per this task's explicit requirement.
- **Approach taken:** Built as a single continuous pass rather than splitting into two stopped sub-builds (Constraint 1) — the two sub-variants share enough structural scaffolding (Module Ownership Contract application, Universal Mode Naming, Step 0B/§7 validation layer) that building them together kept the cross-references (e.g., Restaurant's scope-boundary branch routing into Ecommerce's own Conversion Path) consistent without a stop-and-resume risk of drift.
- **Module Ownership Contract applied throughout:** Every Decision Tree branch and Journey Map step in both sub-variants carries an explicit [Owner: ...] tag. The most consequential application is the existing-customer/order-issue and reservation-modification handoff (Ecom §5 first branch, Restaurant §5 first branch) — both route to Core Agent at intake, before Growth Agent or Conversion Engine ever see the message, directly implementing the Module Responsibility Contract's OWNS/MUST TRANSFER split rather than building parallel support logic inside Commerce.
- **All 14 flagged design questions resolved** (8 Ecommerce, 6 Restaurant) — see the Design Decisions Summary block at the end of each sub-variant for the full list with section references. Judgment-call decisions and their reasoning:
  - **Cart-value escalation threshold** (Ecom Q4): resolved as an unset-by-default business config field (`cart_value_escalation_threshold`), not a hardcoded number — per the Configuration-First Principle (CLAUDE.md Rule 2), the runtime does not decide a business's own risk tolerance for it. When configured, the boundary is inclusive (≥), matching the same directional pattern already established for Restaurant's party-size-10 threshold and Consultation's score boundaries.
  - **Out-of-stock handling** (Ecom Q2): resolved as a 3-step ordered fallback (alternative variant → back-in-stock notification if configured → Mode C) rather than jumping straight to human handoff, because Module 3 §2.1's own Universal fallback rule requires offering the nearest available alternative before falling to the next Mode — this build applies that existing universal rule rather than inventing new fallback philosophy.
  - **Dietary restriction not in KB** (Restaurant Q3): resolved by splitting into safety-relevant (allergy) vs. preference-only, with different escalation priorities (P2 vs. P3) — this split was not explicit in the original open question, but follows directly from Step 0C Level 3's "never override business data with assumptions" combined with the document's established directional bias toward treating higher-stakes cases as higher-stakes (already used for Consultation score boundaries and Restaurant's own party-size threshold).
  - **Gift purchase dual capture** (Ecom Q6): this was already partially resolved in Step 0B's own completion summary ("buyer's info and recipient's info are captured as two distinct moments") — this build completes that resolution by assigning both captures to Tier 3 specifically (not Tier 2 for either) and defining the exact order (buyer first, recipient second), since Step 0B's note didn't specify tier or sequence.
- **New business config fields introduced (added to Appendix A):** `cart_value_escalation_threshold`, `backorder_notification_enabled`.
- **Enterprise Expansion Flags** (per Architecture Expansion Rule — not yet in scope, noted for future expansion):
  - **Complementary-item mapping data model:** The Bundle/Upsell resolution (Ecom Q3) assumes Business Memory can hold a structured complementary-item mapping ("customers who bought X also need Y" style KB data) — this data structure is not yet defined anywhere in the Integration Contract; it is referenced here as a precondition for the upsell trigger to fire at all (no mapping data = no upsell offered, never a fabricated one), but the schema itself is future work.
  - **Reservation modification/cancellation lifecycle:** Restaurant's handoff-on-modification rule (§5, §3) routes any change to an existing reservation to Core Agent Support Handler, consistent with Module 3 EC-07 — but neither this build nor Module 3 yet defines what Core Agent does once it owns a reservation-modification request beyond generic Support Handler behavior (no reservation-specific reschedule mechanics are defined). This is the same gap already flagged in Module 3's own Enterprise Expansion Flags ("Full booking lifecycle... Reschedule Requested... not yet defined anywhere in this module") — restated here as directly relevant to Restaurant, not a new gap.
  - **Pre-arrival dietary confirmation tracking:** The safety-relevant dietary escalation (Restaurant Q3) assumes a human can confirm the matter "before you arrive," but no field or workflow currently tracks whether that pre-arrival confirmation actually happened before the reservation time — an operational gap analogous to Module 3's EC-06 (Emergency unreachable-customer dispatch record), flagged for the same future Operational Exception Handler specification referenced there.
- **Open questions for architect review:**
  - The cart-value escalation threshold (Ecom Q4) is defined as unconfigured-by-default. Architect should confirm whether a sensible default threshold should exist for deployments that never explicitly configure it, or whether "no gate unless explicitly set" is the correct permanent behavior (this build assumed the latter, consistent with the Configuration-First Principle, but flags it since it's a genuine business-risk decision, not a purely architectural one).
  - The safety-relevant dietary restriction's Priority 2 classification (Restaurant Q3) is a new escalation-priority judgment call not dictated verbatim anywhere else in the document — architect should confirm P2 (rather than P1, given the allergy-safety framing) is the correct calibration, since Module 1's own P1 examples ("active safety concern") could arguably be read to include this case if the reservation is imminent.
  - Restaurant's scope-boundary routing (§5, §6) assumes a business running both sub-variants has a reliable way to distinguish reservation intent from order intent at the intent-classification layer (Step 1B) — this build asserts the distinction is inferable from message content (per Step 0A's own framing of the split) but does not define new Step 1B classification logic, since Step 1B is a Step 1 concern and this build does not redefine Step 1 per Rule 4.
- **Ready for architect review:** YES

---

### ARCHETYPE 3 — Appointment Engine (Agentic 4/10)

This section applies the Universal Runtime (Step 1), Freedom Boundary Spec (Step 2), and Service Modules (Step 3) to Appointment's specific customer reality, built against the same hardened Batch 3 foundation as Commerce — the Module Responsibility Contract (Step 1D.0.5), the Universal Availability Validation Layer (Module 3 §2.1), Universal Mode Naming (Module 3 §2), Growth Agent (Module 2), and the Step 0B §7 Data Validation Layer are referenced throughout, not retrofitted. Nothing here overrides those steps — this is archetype-specific configuration and journey built on top of them. Appointment is a single sub-variant (unlike Commerce's Ecom/Restaurant split), so this section follows Emergency's flat structure rather than Commerce's two-part structure.

All 8 design questions flagged as open in the original Execution Plan are resolved directly within the sections below, and restated as explicit decisions in this archetype's completion summary.

---

#### 1. Customer Psychology Summary

Reference: Step 0A Archetype 3 (Appointment) in full. Restated briefly with runtime implications:

```
Mental state:      Self-care/self-improvement oriented, generally
                    unhurried; mild vulnerability component (body
                    image, personal care, wellness) not present in
                    Commerce.
Trust level:       Medium, trending relational rather than
                    transactional — recurring/intimate services mean
                    the customer evaluates the business somewhat like
                    they'd evaluate a person they'll see repeatedly.
Buying readiness:  Mostly Considering → Ready; recurring customers
                    reaching out are usually Post-purchase (reschedule/
                    follow-up).
Patience Window:   MEDIUM. Discovery tolerance: Medium.
Relationship/
Transaction:       40% Transaction / 60% Relationship.
Win condition:     "I have a confirmed time, they know what I need
                    (including anything special about me), and I feel
                    like a person, not a slot filled."
```

**Runtime implications (what this psychology forces at the architecture level):**
```
- Freedom Level 4/10 (Step 2) means a guiding question is expected
  when the customer is unsure ("do you know which type you're after,
  or would you like a quick recommendation?" — Step 2 §3 worked
  example), but multi-session program design or fully open-ended
  judgment calls stay out of scope (Step 2 §3's Consultation-adjacent
  refusal example) — the ceiling is "help decide within this booking,"
  not "plan the customer's ongoing care."
- 60% Relationship weighting is the direct reason membership/package
  upsell is sequenced after booking confirmation, not before (Step 0A
  "what creates confidence" vs. "what causes disengagement") — this
  is the governing psychology behind design question 5's resolution
  (§6 below).
- The "mild vulnerability" component is the direct reason special
  requests (allergy, accessibility, first-timer nerves) require an
  acknowledgment response, not silent logging (Step 0A "what creates
  confidence") — this shapes Data Collection Timing (§4) and the
  special-request handling in the Decision Tree (§5, design question
  6).
- Relational trust in a specific practitioner (Step 0A Common
  Conversation Pattern 5, "do you have anything with [practitioner
  name]") is psychology-level evidence that practitioner-specific
  requests are not a minor filter — they change what "available" means
  for that customer (design question 7, §5/§6 below).
```

---

#### 2. Common Entry Scenarios

Minimum 10 realistic opening messages, each with what it signals. [Owner tags indicate which module the message routes to per the Module Responsibility Contract, Step 1D.0.5.]

```
1. "I'd like to book a massage for Saturday"
   Signals: Knows the service, Ready Buyer (Stage 3), Intent 03
   directly. → [Owner: Conversion Engine] — Growth Agent is skipped
   entirely (design question 1, §3/§5).

2. "what's the difference between a deep tissue and a swedish massage"
   Signals: Doesn't know the service, Evaluator (Stage 2), Intent 01/02.
   → [Owner: Growth Agent, Recommendation Flow B] — guiding question
   per Employee Mindset (design question 1, §3/§5).

3. "I need to move my appointment from Tuesday to Thursday"
   Signals: Existing booking, reschedule, Intent 04. → [Owner: Core
   Agent Support Handler, Module 1 B] — NOT a new-booking flow (design
   question 2, §5).

4. "first time getting a facial, kind of nervous about what to expect"
   Signals: First-timer anxiety. → [Owner: Growth Agent if paired with
   a service question, else Core Agent] — reassurance response, not
   just routing (Step 0A "what creates confidence").

5. "do you have anything with Sarah?"
   Signals: Practitioner-specific request, relational trust already
   established. → [Owner: Conversion Engine, Availability Validation
   Layer scoped to that practitioner] — see Decision Tree §5 (resolves
   design question 7).

6. "I have a nut allergy, is your massage oil nut-based?"
   Signals: Safety-relevant special request, possibly not in KB. →
   [Owner: Core Agent FAQ if confirmed, else escalation branch] — see
   Decision Tree §5 (resolves design question 6).

7. "I use a wheelchair, can your treatment room accommodate that?"
   Signals: Accessibility special request, possibly not accommodable.
   → [Owner: Core Agent, honesty-over-forcing-fit branch] — see
   Decision Tree §5 (resolves design question 6).

8. "do you have a membership or package deal?"
   Signals: Customer-initiated pricing/package question BEFORE
   booking. → [Owner: Core Agent FAQ — factual answer only, no
   proactive upsell logic engaged] — distinct from the agent-initiated
   post-booking upsell moment (design question 5, §6); a direct
   customer question is always answered factually regardless of
   timing rules that govern agent-initiated offers.

9. "can I get 4pm today... actually never mind, I'll come another time"
   Signals: Mid-flow cancellation of an in-progress (not yet
   confirmed) booking. → [Owner: Conversion Engine] — Module 3 §1.1
   CANCELLED state, no recovery record (Module 3 §5.1).

10. "I never made it in yesterday, can we reschedule"
    Signals: Customer-initiated return after a no-show. → [Owner:
    Conversion Engine, standard booking flow] — treated as a fresh,
    ordinary booking request with a non-judgmental tone (Step 0A), NOT
    routed through the no-show Recovery trigger (§7 below), since that
    trigger is for system-initiated re-engagement when the customer
    has NOT already returned on their own (design question 3).

11. "can you fit me in earlier, this time doesn't work"
    Signals: Availability conflict, Medium Patience Window. → [Owner:
    Conversion Engine, Availability Conflict Handling] — see Decision
    Tree §5 (design question 4).

12. "I want to cancel my appointment"
    Signals: Existing booking, Intent 06. → [Owner: Core Agent Support
    Handler, Module 1 B] — same ownership pattern as reschedule
    (design question 2, §5).

13. "how much does a facial cost"
    Signals: Pure informational, Intent 01. → [Owner: Core Agent FAQ
    Handler]

14. "this is the second time you've messed up my booking, unacceptable"
    Signals: Complaint, Intent 05, Universal Psychology Override. →
    [Owner: Core Agent Complaint Handler, Module 1 C] — Appointment
    flow stands down entirely until resolved.

15. "I want a massage but honestly not sure this place is legit"
    Signals: Trust objection. → [Owner: Growth Agent, Objection
    Handling C — Trust type] — evidence-based response, not just
    reassurance.
```

---

#### 3. Full Conversation Journey Map

**Happy path (customer knows the service, Ready Buyer, no branches triggered):**
```
Customer message received
↓
1A Session State Check (New / Returning Lead / Existing Customer /
   Dormant Customer)
↓
1B Intent Classification
↓
Intent 04/06 (existing booking — reschedule/cancel) detected?
  YES → [Owner: Core Agent, Module 1 B] — full handoff, Appointment
        flow stands down for this conversation (see §5, design
        question 2).
  NO  → continue
↓
Does the customer already know the service AND specify enough to book
   directly? (Buying Stage Detection, Module 2 §A.0 — Stage 3 Ready
   Buyer, per design question 1)
  YES → [Owner: hands directly to Conversion Engine, Module 2 EC-01 —
        Growth Agent is skipped entirely]
  NO  → [Owner: Growth Agent] Discovery (Stage 1) / Recommendation
        (Stage 2) — one guiding question per Employee Mindset (Step
        0A), Freedom 4/10
↓
Practitioner-specific request present? (design question 7)
  YES → [Owner: Conversion Engine] Availability Validation Layer
        scoped to that practitioner's calendar specifically
  NO  → [Owner: Conversion Engine] Availability Validation Layer,
        any-available-practitioner
↓
Availability confirmed?
  YES → continue to Mode A
  NO  → Availability Conflict Handling (§5/§6, design question 4)
↓
Action Permission Check (1D.1) — "reserve slot" permission granted?
  YES → Mode A (Direct Booking)
  NO  → `appointment_selfservice_link_enabled` config check (design
        question 8)
        YES → Mode B, Guided Self-Service Booking
        NO  → Mode B, Request Booking
↓
Tier 2/3 data collection, special requests bundled (§4, design
   question 6) — [Owner: Conversion Engine, Module 3 §4]
↓
Booking confirmed, explicit confirmation language stated
↓
Post-booking Opportunity Detection check (design question 5) —
   [Owner: Growth Agent, Module 2 §E, one check only, capped at one
   offer]
↓
Step 1G Exit: End State 1 (Confirmed) or End State 2 (Open Opportunity
   — Mode B pending human/self-service completion)
```

**Branch paths (each detailed fully in §5 Decision Tree):**
```
- Existing-booking reschedule/cancellation handoff branch (design
  question 2)
- Special request — safety-relevant, not accommodable branch (design
  question 6)
- Special request — preference-only, not in KB branch (design
  question 6)
- Practitioner-specific unavailability branch (design question 7)
- Availability conflict branch (design question 4)
- No-show follow-up branch (design question 3, §7)
- Complaint / trust-broken mid-flow branch
- Conversion Engine OFF fallback branch
```

---

#### 4. Data Collection Timing

Applying Step 0B doctrine and the Step 0B §7 Data Validation Layer specifically to Appointment, consistent with Commerce's discipline of building validation in from the start.

```
Tier applied: Tier 2 (Value Exchange Capture) primary, Tier 3
  (Commitment Capture) secondary — per Step 0B §4's Per-Archetype
  Collection Mapping Table.

Exact timing:
  1. Tier 2 (slot-confirmation offer): triggered once a specific time
     is being considered — "I can send you a confirmation and
     reminder — what's your email?" (Step 0B §3 worked example).
  2. Tier 3 (booking completion): triggered at Conversion Engine entry
     (Module 3 §4) — customer_name, contact method, special requests
     bundled into the SAME step, not a separate ask (Step 0B §4
     Special Rules — resolves design question 6's bundling
     requirement).

Special requests (allergy, accessibility, equipment needs, first-timer
  note) are collected alongside Tier 3, framed as part of confirming
  the booking: "I'll get you booked for [service] on [date] at
  [time] — anything I should note, like an allergy or accessibility
  need?" This is identical in structure to Restaurant's special-
  request bundling (Commerce Restaurant §4) — the same Step 0B rule
  applied to a different archetype, not a new rule.

Field validation applied per Step 0B §7:
  - Name: validated per §7.1 Name rules.
  - Date/Time: validated per §7.1 Date/Time rules — feeds directly
    into Availability Conflict Handling (§5/§6) when the requested
    time fails the calendar check, and into the past-date correction
    pattern already established elsewhere in this document.
  - Email/Phone: validated per §7.1/§7.2/§7.3 as in any other
    archetype, including the graceful-persistence accept-with-flag
    fallback after one correction attempt.
```

**Backend submission gate:** Per Step 0B §7.4, the transition from DATA_COLLECTION to ACTION_PENDING (Module 3 §1.1) does not fire until all required Tier 2/3 fields for the specific mode are VALID or INVALID-FLAGGED — a NOT-YET-COLLECTED name or contact method blocks the booking action, consistent with Module 3 §4's existing rule.

---

#### 5. Decision Tree

All conditions with explicit YES/NO branches. No dead ends. [Owner] tags applied per the Module Responsibility Contract (Step 1D.0.5).

```
MESSAGE RECEIVED
↓
IS THIS INTENT 04/06 (EXISTING BOOKING — RESCHEDULE OR CANCEL)? (design
question 2 — the key ownership boundary for this archetype)
  YES → [Owner: Core Agent Support Handler, Module 1 B] — full
        ownership transfer at intake. The exact signal that triggers
        this: the customer references an EXISTING, already-confirmed
        booking ("move my appointment," "cancel my appointment," "I
        need to change my time") rather than describing a new need —
        this is intent-level, not keyword-level, consistent with the
        Module Responsibility Contract's OWNS/MUST TRANSFER split
        (Conversion Engine "MUST TRANSFER" post-completion
        modification requests to Core Agent, per Module 3 EC-07). No
        parallel reschedule/cancel logic is built inside this
        archetype — Core Agent reads current Business Memory (the
        existing booking) as the record to modify, same pattern as
        Commerce's reservation-modification resolution.
  NO  → continue
        ↓
IS THIS A COMPLAINT / TRUST-BROKEN SIGNAL? (Intent 05, Universal
Psychology Override)
  YES → [Owner: Core Agent Complaint Handler, Module 1 C] —
        Appointment flow stands down entirely until resolved.
  NO  → continue
        ↓
DOES THE CUSTOMER ALREADY KNOW THE SERVICE AND SPECIFY ENOUGH TO BOOK
DIRECTLY? (design question 1)
  YES (Intent 03, Stage 3 Ready Buyer per Module 2 §A.0) → [Owner:
        hands directly to Conversion Engine, skipping Growth Agent
        entirely — Module 2 EC-01: "no requirement that Discovery run
        before every conversion."]
  NO  (Intent 01/02, Stage 1 Explorer or Stage 2 Evaluator) → [Owner:
        Growth Agent] Discovery (A) if need is vague / Recommendation
        (B) if a guiding question resolves it — one guiding question
        per Employee Mindset (Step 0A: "do you know which type you're
        after, or would you like a quick recommendation?"), Freedom
        4/10. → re-evaluate this same check on the next message.
        ↓
IS THIS A TRUST OBJECTION OR FIRST-TIMER ANXIETY SIGNAL?
  YES → [Owner: Growth Agent, Objection Handling C — Trust type, or a
        reassurance response if purely anxiety with no explicit
        objection] — evidence-based / warm reassurance per Step 0A
        "what creates confidence," then continue toward booking.
  NO  → continue
        ↓
IS THIS A PRACTITIONER-SPECIFIC REQUEST? (design question 7)
  YES → [Owner: Conversion Engine] — the Availability Validation Layer
        (Module 3 §2.1) is scoped to that specific practitioner's
        calendar, not "any available" — this modifies the SAME
        availability check, it does not trigger a different Mode.
        Availability confirmed for that practitioner?
          YES → continue to Mode A/B as normal, for that practitioner.
          NO  → Availability Conflict Handling (below) applies, WITH
                one archetype-specific ordering rule: alternatives are
                offered same-practitioner-different-time FIRST
                (preserving the relational trust signal, per Step 0A's
                practitioner-request psychology), then
                different-practitioner-same-time SECOND, only if the
                customer's response invites it — never silently
                substituting a different practitioner without
                disclosing the change.
  NO  → continue (any-available-practitioner Availability Validation
        Layer applies as Module 3 already defines it)
        ↓
DOES THE CUSTOMER MENTION A SPECIAL REQUEST NOT CONFIRMABLE FROM
BUSINESS MEMORY? (design question 6 — follows Commerce Restaurant's
dietary-restriction resolution and Growth Agent's No Suitable
Recommendation Handling, B.1, honesty-over-forcing-a-fit principle)

  IS IT SAFETY/ACCESS-CRITICAL (allergy, mobility/accessibility
  requirement, medical condition relevant to the service)?
    YES → [Owner: Core Agent, escalation path] — Agent: "I don't have
          that confirmed in what I have access to, and I don't want to
          guess or book you into something that might not actually
          work — let me get this confirmed before we lock in your
          time." Priority 2 (Standard) per Module 1 D. Unlike
          Restaurant's allergy case (where the reservation is
          confirmed and the kitchen confirms before arrival), an
          Appointment booking is NOT finalized as Confirmed until the
          accommodation question resolves — booking a customer into a
          service the business genuinely cannot deliver on arrival is
          a worse failure than a short delay before confirming,
          consistent with the higher-stakes-wins-ties directional bias
          applied one notch further here because arrival-time failure
          for a personal/physical service is harder to recover from
          than a kitchen substitution.
    NO (preference-only — e.g., "please use unscented products if
    you have them") → [Owner: Core Agent, informational] — Agent:
          "I don't have that confirmed, but I'll note it so the team
          can accommodate or let you know when you arrive." Priority 3
          (Review), booking proceeds normally with the note attached —
          same pattern as Restaurant's preference-only dietary case.
  NO (KB confirms the answer, or no special request made) → continue
        normally, or [Owner: Core Agent FAQ] if a factual answer
        resolves it.
        ↓
AVAILABILITY VALIDATION LAYER (Module 3 §2.1): is a calendar slot
available at the requested time (for the specific practitioner if
one was requested, per above)?
  YES → continue to Action Permission Check.
  NO  → AVAILABILITY CONFLICT HANDLING (design question 4, already
        defined in Module 3, shown here in Appointment's Medium
        Patience Window context):
          1. Offer 2-3 nearest available alternatives — not a bare
             "not available." Medium Patience Window (Step 0A) means
             the customer expects this to visibly move the booking
             forward, not just register a failure — alternatives are
             offered in the SAME turn as the unavailability, never as
             a separate "let me check and get back to you" unless a
             genuine system limitation requires it (Module 3 §5).
          2. IF no alternative fits the customer's stated constraints
             → Mode C (Human Callback): capture Tier 3 fields, route
             to Human Handoff Handler, Priority 3 (Review) — a
             scheduling gap, not urgent (Module 3 Availability
             Conflict Handling, applied as-is).
↓
ACTION PERMISSION CHECK (1D.1): "reserve slot" permission granted?
  YES → Mode A (Direct Booking)
  NO  → `appointment_selfservice_link_enabled` config flag true?
        (design question 8)
          YES → Mode B, Guided Self-Service Booking — direct link to
                the booking calendar/system.
          NO  → Mode B, Request Booking — collect preferred date/time
                + Tier 3 fields, create Pending record, human confirms.
↓
TIER 2/3 FIELDS VALID OR INVALID-FLAGGED? (Step 0B §7.4 Backend
Submission Gate)
  NO  → Hold at DATA_COLLECTION, apply Correction Flow (§7.3) — one
        flag, one re-attempt, then accept-with-flag.
  YES → Proceed to ACTION_PENDING → CONFIRMED (Module 3 §1.1).
↓
POST-BOOKING OPPORTUNITY CHECK (design question 5) — [Owner: Growth
Agent, Module 2 §E] — booking already CONFIRMED (Mode A) or Pending
(Mode B)?
  Membership/package upsell offered ONLY after this point, never
  before or during the booking sequence above — one offer, optional,
  never re-offered if declined (Module 2 §E's existing cap, applied at
  a shifted timing point specific to Appointment).
↓
Step 1G Exit
```

---

#### 6. Conversion Path

Full flow for Appointment's three Conversion Engine modes (per Step 3 Module 3, applied at the archetype level), presented per the Universal Mode Naming (Batch 3): Agentic Completion (A) / Assisted Capture-or-Guided External Completion (B, two sub-types) / Human Handoff (C).

**Mode A — Agentic Completion (Direct Booking):**
```
Entry: Action Permission Check (1D.1) grants "reserve slot."
1. Confirm service, date, time, practitioner (if applicable, per §5
   practitioner-specific branch) from Session Memory/handoff or
   collect fresh.
2. Availability Validation Layer (§2.1), scoped to the specific
   practitioner if requested.
3. IF available → create calendar event, confirm explicitly: "you're
   booked for [service] on [date] at [time] with [practitioner]."
   Collect Tier 3 fields (name + contact) plus any special request
   already flagged, bundled into this same step (§4, design question
   6).
4. IF unavailable → Availability Conflict Handling (§5).
Exit: Confirmed → Step 1G End State 1.
```

**Mode B — Assisted Capture / Guided External Completion, two sub-types (design question 8):**

The config flag `appointment_selfservice_link_enabled` (boolean, Module 3 Batch 3 Round 3 addition) determines which sub-type is available whenever "reserve slot" permission is not granted:

```
IF `appointment_selfservice_link_enabled` = true AND a self-service
booking link integration exists for this deployment:
  → GUIDED SELF-SERVICE BOOKING applies.
  1. Provide a direct, specific link to the booking calendar/system
     (e.g., a Calendly/cal.com-style link) — never a generic contact
     page.
  2. Agent: "Here's a direct link to book — you'll see real-time
     availability and can pick what works for you."
  Exit: Step 1G End State 2 (Open Opportunity) unless the customer
     confirms in-session completion, in which case End State 1.

IF `appointment_selfservice_link_enabled` = false, OR no self-service
integration exists:
  → REQUEST BOOKING applies (the only Mode B sub-type available).
  1. Collect preferred date/time and Tier 3 contact fields, framed as
     "I'll get this requested and someone will confirm shortly."
  2. Create a Pending booking record (booking_status = "Pending") —
     never imply confirmation the agent cannot guarantee.
  Exit: Step 1G End State 2 (Open Opportunity) until human confirms.
```

This is a straight application of Module 3's existing config-gated sub-type split — this build's contribution is showing the decision explicitly in conversational context rather than leaving the two sub-types as parallel, undifferentiated references.

**Mode C — Human Handoff (via Availability Conflict Handling, already defined in Module 3):**
```
Entry: No alternative fits the customer's stated constraints (§5),
   OR a safety/access-critical special request requires human
   confirmation before the booking can be finalized (§5, design
   question 6).
1. Capture Tier 3 fields as part of the handoff.
2. Route to Human Handoff Handler, Priority 3 (Review) for a standard
   scheduling gap, or Priority 2 (Standard) for the safety/access-
   critical special-request case specifically (§5's escalation
   boundary rationale).
Exit: Step 1G End State 5.
```

**Membership/package upsell timing (design question 5, resolved):** Per Step 0A's explicit instruction ("offering membership/package upsell only after the first booking is confirmed"), Growth Agent's Opportunity Detection (Module 2 §E) is triggered AFTER Conversion Engine reaches CONFIRMED (Mode A) or the booking request is submitted as Pending (Mode B) — not before Conversion Engine handoff, which is where Commerce's Ecom build placed it. This is a genuine, archetype-specific sequencing difference: Module 2 §E's own rules ("never in the same turn as the primary recommendation," "never before the primary recommendation has received a positive response") do not prohibit a post-conversion trigger point — they only constrain how early the offer can appear, not how late. Ownership passes briefly back to Growth Agent (if active) for exactly one Opportunity Detection check, bounded by the existing one-per-conversation cap and the existing "never during Complaint/Support context" rule (Module 2 §E), before Step 1G actually closes the conversation. A direct customer-initiated question about membership/packages at any point in the conversation (Entry Scenario 8) is still answered factually by Core Agent FAQ immediately, regardless of this sequencing rule — the rule governs when the AGENT may proactively raise it, not when the agent may answer a direct question.

---

#### 7. Recovery Trigger Moments

Exact triggers and non-triggers, per Module 4 applied specifically to Appointment. This section uses Module 4's existing trigger definitions and cadence profile for the pre-booking case, and defines one new archetype-specific trigger for the post-booking no-show case (design question 3), layered on top of Module 4 the same way Commerce's out-of-stock fallback was layered on top of Module 3 — Module 4's own text is not redefined.

```
RECOVERY TRIGGER (pre-booking, exact moment, per Module 4 §2):
  Conversation ends after availability discussion, no booking
  confirmed. OR: Date/time collected (Module 3 DATA_COLLECTION state
  reached), no confirmation completed.

RECOVERY PROFILE: Appointment — 1 hr → 24 hr → 3 days → 7 days, 4
  steps, per Module 4 §3. Tapering cadence reflecting that the
  specific date discussed becomes less relevant over time.

Tone: Warm, low-pressure — an invitation to pick back up, not a
  reminder that they "still haven't booked" (Module 4 §4 tone rules,
  applied as-is).
```

**No-show follow-up (design question 3, new — resolved as a distinct Recovery Engine intake trigger, NOT covered by Module 4 §2's existing table, which only defines pre-conversion abandonment):**
```
Why this needs a new trigger, not the existing one: Module 3 §5.1
  (Conversion Abandonment Detection) explicitly states "CONFIRMED +
  customer stops responding → Not abandonment. Conversion is
  complete." A no-show is fundamentally different from that — the
  booking WAS confirmed, the customer simply did not attend at the
  scheduled time. None of Module 4 §8's nine enterprise intake sources
  (A-I) cover this moment either; Source H (Customer Reactivation) is
  the closest, but its Appointment threshold is 60 days of inactivity
  — a same-day/next-day no-show follow-up needs to happen far sooner
  than that, for a different psychological reason (Step 0A: "different
  emotional tone needed — non-judgmental — than a fresh booking
  conversation").

NO-SHOW RECOVERY TRIGGER (exact moment):
  The scheduled appointment time passes with the booking record still
  in a Confirmed state and no check-in/completion signal from the
  business's own system (calendar/POS status update, per Business
  Memory) — this is a system-detected event, not something the agent
  observes directly in a live conversation, since by definition no
  conversation is happening at that moment.

Distinct, single-touch cadence (not the standard 4-step Appointment
  profile above): ONE follow-up message, sent within a business-
  configured window after the missed time (default: same day,
  end-of-business-hours), non-judgmental tone per Step 0A — e.g., "We
  had you down for [service] today and wanted to check in — happy to
  get you rebooked whenever works." No second automated touch; if this
  doesn't produce a reply, the standard suppression/stop-condition
  machinery (Module 4 §5/§6) applies exactly as it does for any other
  recovery record — this new trigger only defines WHEN the record is
  created and its distinct tone/cadence-length, not new suppression or
  stop-condition logic (those are used from Module 4 unmodified).

NON-TRIGGER: Customer proactively returns and requests a new
  booking/reschedule on their own (Entry Scenario 10) BEFORE the
  system-detected no-show trigger fires — this is treated as an
  ordinary fresh booking request (Conversion Engine, standard flow),
  not a recovery-record follow-up, since the customer already
  re-engaged without needing the nudge.
```

**Non-triggers (specific to Appointment, extending Module 4 §2's universal list with archetype application, not new rules):**
```
- Customer explicitly cancels (Intent 06, routed to Core Agent per §5)
  — Module 3 CANCELLED-state logic and Module 4 §2's existing non-
  trigger ("explicit customer cancellation") apply unchanged.
- Mode C (Human Handoff) outcomes — Step 1G End State 5, no recovery
  record while a human owns the conversation (Module 4 §2 non-trigger
  list).
```

---

#### 8. Escalation Boundaries

All triggers with exact agent behavior on detection, applying Module 1's existing Escalation Priority Classification (P1/P2/P3) — not reinvented here.

```
TRIGGER: Complaint / trust-broken signal (Intent 05)
  Behavior: Core Agent Complaint Handler (Module 1 C) takes the
  conversation first; Appointment flow stands down. Priority per
  Module 1 D's existing classification.

TRIGGER: Safety/access-critical special request not confirmable from
  Business Memory (§5 — design question 6)
  Behavior: Priority 2 (Standard) — booking is not finalized as
  Confirmed until a human confirms the accommodation; deliberately one
  tier above the preference-only case (Priority 3), same directional
  bias already established in Commerce Restaurant's dietary-
  restriction resolution.

TRIGGER: Preference-only special request not confirmable from
  Business Memory (§5)
  Behavior: Priority 3 (Review) — noted on the booking, not escalated
  urgently; booking proceeds normally.

TRIGGER: Availability Conflict Handling exhausted (no alternative
  fits, §5/§6)
  Behavior: Mode C, Priority 3 (Review) per Module 3's existing rule —
  a scheduling gap, not urgent.

TRIGGER: Practitioner-specific unavailability with no acceptable
  alternative (§5, design question 7)
  Behavior: Same as the general Availability Conflict Handling
  exhaustion case above — Priority 3, not elevated further just
  because a specific practitioner was requested (the relational
  preference affects HOW alternatives are ordered, not the escalation
  priority itself).

TRIGGER: Confidence Gate (1D.2) Low/Conflicting on availability itself
  (e.g., calendar system returns an ambiguous result)
  Behavior: Per Module 3 §5 (Calendar/Registration System Unavailable),
  single retry, then fall to Mode B or C — never a confident-sounding
  confirmation of an uncertain slot (Module 3 §5 Universal failure
  rule).

TRIGGER: Existing-booking reschedule/cancellation request requiring
  verification beyond Zero-Verification tier (§5, design question 2)
  Behavior: Per Module 1 B's Customer Verification Rule, a booking
  modification is at minimum Low-Risk (confirm one known identifier)
  and may be High-Risk depending on what's being changed — Core Agent
  applies its own existing verification tiers, not a new Appointment-
  specific rule.
```

---

**Appointment — Design Decisions Summary (all 8 resolved):**
```
1. Knows-service vs. doesn't-know-service — fork happens at Intent
   Classification (1B) combined with Buying Stage Detection (Module 2
   §A.0): a named service + enough detail to book = Intent 03/Stage 3,
   Growth Agent skipped entirely (Module 2 EC-01); an unnamed/unclear
   need = Intent 01/02/Stage 1-2, Growth Agent Discovery/Recommendation
   engages with one guiding question — §3, §5.
2. Rescheduling/cancellation — Core Agent Support Handler owns this at
   intake, triggered by intent-level recognition of "existing booking"
   language, not keyword matching; no parallel logic built in
   Appointment — §5 (first branch), §8.
3. No-show follow-up — new, distinct Recovery Engine intake trigger
   (system-detected, appointment-time-passed-with-no-check-in), single
   non-judgmental touch, NOT the standard 4-step cadence — resolved as
   genuinely new since neither Module 4 §2's table nor §8's nine
   sources cover a post-CONFIRMED no-show — §7.
4. Availability conflict — Module 3's existing rule (2-3 alternatives,
   then Mode C) shown in full conversational context, calibrated to
   Appointment's Medium Patience Window (alternatives offered same-
   turn, not "let me check and get back to you") — §5, §6.
5. Membership/package upsell timing — Growth Agent Opportunity
   Detection (Module 2 §E) triggered AFTER Conversion Engine reaches
   CONFIRMED/Pending, not before handoff (the reverse of Commerce
   Ecom's placement) — a genuine archetype-specific sequencing
   difference justified by Step 0A's explicit instruction and
   permitted by Module 2 §E's own rules (which restrict how early, not
   how late, an offer may appear) — §5, §6.
6. Special requests — bundled into the same Tier 3 step as booking
   confirmation (not a separate ask), with a safety/access-critical vs.
   preference-only split mirroring Commerce Restaurant's dietary
   resolution: safety/access-critical → booking not finalized until
   human-confirmed (P2); preference-only → noted, booking proceeds (P3)
   — §4, §5, §8.
7. Practitioner-specific requests — modify the SAME Availability
   Validation Layer (scoped to that practitioner's calendar) rather
   than triggering a different Mode; if unavailable, alternatives are
   ordered same-practitioner-different-time before different-
   practitioner-same-time, preserving the relational trust signal — §5,
   §6.
8. Self-service link mode adoption — `appointment_selfservice_link_enabled`
   config flag explicitly gates which Mode B sub-type applies: true +
   integration exists → Guided Self-Service Booking; false or no
   integration → Request Booking is the only Mode B sub-type — shown in
   full conversational context, not just referenced as coexisting — §6.
```

---

## STRESS-TEST CROSS-CHECK (Appointment)

Required before completion, per Step4_Appointment_Instructions.md. Every existing stress-test case that references Appointment (`Stress_Test_Library_v1.md` Sections 1, 2.3, 4, 5) is walked through against the Decision Tree and Journey Map built above.

```
U-01/U-02/U-03/U-04/U-06/U-08 (Section 1.1, Customer Behavior Matrix):
  Intent 01/02/03/04/06/08 routing — satisfied directly. Intent 04/06
  (existing booking) is the first branch checked in the Decision Tree
  (§5), routing to Core Agent before any Appointment-specific logic
  runs, per the Module Ownership Contract. Intent 08 (trust objection)
  is satisfied by the Trust Objection branch (§5) using Module 2 §C
  unmodified.

MC-01 (Memory Conflict — spa treatment with nut-based product, customer
  states a nut allergy this session, no prior allergy on Customer
  Memory):
  Satisfied directly — this is an Appointment-archetype scenario. Per
  §5's safety/access-critical special-request branch, a stated allergy
  is exactly this case: Session Memory (current statement) is
  authoritative, the agent does not proceed with a recommendation/
  booking that conflicts with it, and — per this build's specific
  resolution — the booking is not finalized as Confirmed until the
  ingredient/accommodation question is confirmed (Priority 2), which
  is a strictly safer outcome than MC-01's own pass criteria required
  ("agent does not proceed with the nut-based recommendation").

Section 2.3 (Appointment Configuration Combination Table, Config A/B/C):
  Confirmed consistent — Config A's fallback message, Config B's
  "book/reschedule/confirm not possible, proactive recommendation
  requires Growth ON" boundary, and Config C's full-stack behavior all
  match this build's Conversion Path (§6) and Decision Tree (§5)
  without contradiction. No archetype-specific behavior built here
  overrides any config-level boundary already defined.

RT-01 (angry customer mid-flow):
  Satisfied — the Decision Tree (§5) checks for Intent 05/Universal
  Psychology Override early and per-message, consistent with RT-01's
  expectation that a complaint preempts an in-progress booking flow.

RT-07 / Module 3 §1.2 (duplicate booking action):
  Satisfied by reference — Module 3 §1.2 Duplicate Action Protection
  explicitly names Appointment as one of the two archetypes (with
  Emergency) where duplicate records create real operational problems;
  this build's Conversion Path (§6) does not alter or bypass that
  check.

RT-13 (concurrent sessions, differing intents):
  Satisfied by reference — Step 1A's Concurrent Session Deduplication
  Rule is a universal runtime behavior; nothing in the Appointment
  Decision Tree changes how a second, differently-intended session is
  handled.

RT-14 / DV-01 / DV-03 / DV-04 (invalid or insisted-invalid data):
  Satisfied by reference — Data Collection Timing (§4) applies Step 0B
  §7's validation, correction-flow, and country-code rules unmodified
  to every Tier 2/3 field collected in Appointment, including the
  special-request note field introduced by this build.

DR-04 (existing customer, Zero-Verification-tier re-ask):
  Satisfied by reference and directly relevant to §5/§8's reschedule/
  cancel escalation boundary — Module 1 B's Customer Verification Rule
  (Zero-Verification / Low-Risk / High-Risk tiers) applies unmodified;
  this build does not invent a separate Appointment-specific
  verification standard, it names which tier a reschedule/cancel
  typically falls into (§8) and defers to Module 1 B for the actual
  check.

DV-02 (relative-date resolution, e.g. "next Tuesday"):
  This is the same pre-existing, already-documented open gap at the
  Step 0B layer already flagged during the Commerce build (Stress Test
  Library Open Gap 6) — natural-language relative-date resolution
  happens upstream of Step 0B §7's format/range validation, for every
  archetype. Appointment's date collection (§4, §5) is exactly as
  exposed to this gap as Restaurant's — but resolving it would mean
  redefining Step 0B itself, out of scope for an archetype-level
  build (Rule 4: reference, don't redefine). Not a new gap this build
  reveals; restated for completeness, left with Step 0B as its owner —
  same discipline as Commerce's DV-02 flag.
```

**Result:** No new, previously-undiscovered gap was found that this Appointment build fails to cover. One pre-existing, cross-archetype gap (DV-02) is confirmed to also apply to Appointment, flagged rather than fixed, consistent with the Commerce precedent.

---

## STEP 4 ARCHETYPE 3 (APPOINTMENT) COMPLETION SUMMARY

- **Sections completed:** 1. Customer Psychology Summary / 2. Common Entry Scenarios (15) / 3. Full Conversation Journey Map / 4. Data Collection Timing / 5. Decision Tree / 6. Conversion Path / 7. Recovery Trigger Moments / 8. Escalation Boundaries.
- **Approach taken:** Single continuous pass (Constraint 1) — Appointment's smaller scope (one sub-variant) made a split unnecessary; the build was completed in one pass without a stop-and-resume risk.
- **Module Ownership Contract applied throughout:** Every Decision Tree branch and Journey Map step carries an explicit [Owner: ...] tag. The most consequential application is the existing-booking reschedule/cancellation handoff (§5, first branch) — routes to Core Agent at intake, before Growth Agent or Conversion Engine ever see the message, directly implementing the Module Responsibility Contract's OWNS/MUST TRANSFER split, the same pattern used for Commerce's "returning customer with order issue" resolution.
- **All 8 flagged design questions resolved** — see the Design Decisions Summary block above for the full list with section references. Judgment-call decisions and their reasoning:
  - **No-show follow-up** (Q3): resolved as a genuinely new Recovery Engine intake trigger, not covered by Module 4 §2's existing table or §8's nine enterprise sources — a single non-judgmental touch, distinct from the standard 4-step cadence, layered on top of Module 4 the same way Commerce's out-of-stock fallback was layered on top of Module 3 (Module 4's own text is unmodified).
  - **Membership/package upsell timing** (Q5): resolved as the reverse of Commerce Ecom's sequencing — Growth Agent's Opportunity Detection fires AFTER Conversion Engine reaches CONFIRMED/Pending, not before handoff — justified by Step 0A's explicit instruction and permitted by Module 2 §E's own rules, which restrict how early an offer may appear but not how late.
  - **Special requests** (Q6): resolved with a safety/access-critical vs. preference-only split, directly mirroring Commerce Restaurant's dietary-restriction resolution and Growth Agent's No Suitable Recommendation Handling (B.1) — the safety/access-critical case is calibrated one notch more conservative than Restaurant's allergy case (booking not finalized as Confirmed at all, vs. Restaurant's confirmed-but-flagged-for-kitchen-check), reasoned as: an Appointment failure surfaces at arrival for a personal/physical service, which is harder to recover from in the moment than a kitchen substitution.
  - **Practitioner-specific requests** (Q7): resolved as a parameter to the existing Availability Validation Layer (which calendar to check) rather than a new Mode, with an alternative-ordering rule (same-practitioner-different-time before different-practitioner-same-time) that preserves the relational-trust signal Step 0A identifies as specific to this archetype.
- **New Business Config fields:** None newly introduced by this build — Appointment's config surface (`appointment_selfservice_link_enabled`, `max_booking_horizon`) was already fully defined in Module 3 (Batch 3 Round 3) and Appendix A (Step 0B §7.1) respectively. **Post-Step-4 scan correction:** `appointment_selfservice_link_enabled` had been defined in Module 3's body text but was missing from Appendix A's Business Config Additions list — added during the comprehensive scan; not a change introduced by this build. The no-show follow-up trigger (§7) uses existing booking_status/calendar fields and does not require a new config flag beyond an implicit default send-window (same-day, end-of-business-hours), which reuses Module 4 §3.1's existing send-window mechanism rather than introducing a new one.
- **Enterprise Expansion Flags** (per Architecture Expansion Rule — not yet in scope, noted for future expansion):
  - **No-show detection mechanism:** §7's no-show trigger assumes the business's own calendar/POS system can signal "appointment time passed, no check-in" — this detection signal itself is not defined anywhere in the Integration Contract (it would need a webhook or a scheduled-trigger poll, per Step 1.0.1's External Event Entry Point pattern); this build defines the trigger's existence and psychology, not the detection plumbing.
  - **Full booking lifecycle (restated, not new):** Same gap already flagged in Module 3's own Enterprise Expansion Flags ("Full booking lifecycle... Reminder Sent... Reschedule Requested... No-Show... not yet defined anywhere in this module") — this build's no-show resolution (§7) is a partial, archetype-level answer to that flag (defining the follow-up trigger), not a full lifecycle implementation; reminders and reschedule-request mechanics remain unaddressed.
  - **Practitioner-level calendar granularity:** §5/§6's practitioner-specific Availability Validation Layer assumes the underlying calendar integration supports querying by individual practitioner, not just by business/location — not confirmed anywhere in the Integration Contract's Demo Phase Rules; flagged for architect confirmation the same way Module 3's own completion summary flagged the Demo-vs-Production availability-check gap (Q3, already resolved as "Runtime defines final enterprise behavior, Demo/Production differences handled separately").
- **Open questions for architect review:**
  - The safety/access-critical special-request escalation priority (P2, §8) is a new judgment call, calibrated deliberately more conservative than Restaurant's equivalent (P2 but booking not finalized at all vs. Restaurant's P2-with-confirmed-booking) — architect should confirm this asymmetry between the two archetypes is correct, or whether Appointment should also allow a Confirmed-but-flagged booking in some cases (e.g., minor accessibility notes vs. genuine medical/mobility blockers).
  - The no-show follow-up's default send window (same-day, end-of-business-hours) is this build's own reasonable default, not sourced from any existing config field or business data — architect should confirm this default, or whether it should be a new configurable field rather than a hardcoded assumption.
  - Post-booking Opportunity Detection's exact re-entry mechanism (Conversion Engine handing control back to Growth Agent after CONFIRMED, before Step 1G closes) is described narratively (§6) but does not define a new formal state-machine transition — architect should confirm this is sufficient as a Step 4-level behavioral description, or whether Module 3's Conversion State Machine (§1.1) should eventually gain an explicit post-CONFIRMED hook for this and similar future cases.
- **Ready for architect review:** YES

---

### ARCHETYPE 4 — Engagement Engine (Agentic 4/10)

This section applies the Universal Runtime (Step 1), Freedom Boundary Spec (Step 2), and Service Modules (Step 3) to Engagement's specific customer reality, built against the same hardened Batch 3 foundation as Commerce and Appointment. This build is structurally different from the prior three archetype builds, per the original Execution Plan's own flag that Engagement is "weakest in the original architecture, needs redesign" — Engagement has no single conversion type (Donate/Volunteer/Attend are three genuinely distinct paths, not one flow with three labels), no scoring/qualification gate, and a passive-supporter outcome that is a designed success state, not a fallback. Sections 3–6 below are built as one shared Entry/Trust-Building opening feeding into **four** parallel, fully-specified paths — Donate, Volunteer, Attend, and Passive Supporter — rather than a single universal flow. Sections 1, 2, 7, and 8 are shared across all four paths where the underlying psychology, recovery mechanics, and escalation classification genuinely don't diverge by conversion type; where they do diverge (Data Collection Timing, Decision Tree), this build gives each path its own explicit treatment per the instructions' Rule 1.

All 8 design questions flagged as open (6 from the original Execution Plan, 2 surfaced by this build) are resolved directly within the sections below, and restated as explicit decisions in this archetype's completion summary. Per the instructions, Module 4's Engagement recovery cadence (1 day → 7 days → 21 days, 3 steps — approved, but with no corresponding n8n workflow built yet, future WF-105) is used exactly as specified in Module 4 §3 — this build does not attempt to resolve that infrastructure-build question.

---

#### 1. Customer Psychology Summary

Reference: Step 0A Archetype 4 (Engagement) in full — this section already has real depth per the instructions; cited and extended here, not restated.

```
Mental state:      Values-driven and exploratory — rarely "what do I
                    get," almost always "does this matter to me, do I
                    trust this organization."
Trust level:       Low to Medium; impact-skepticism is the DEFAULT
                    starting posture, not the exception.
Buying readiness:  Skews Exploring/Considering far more than any other
                    archetype; true Ready is a smaller share.
Patience Window:   LONG. Discovery tolerance: High. Trust-building is
                    part of conversion, not a delay before it.
Relationship/
Transaction:       20% Transaction / 80% Relationship — the lowest
                    Transaction weight of any archetype.
Win condition:     "I understand what this organization actually does
                    and believe it's real. I found a way to contribute
                    that matches what I can actually give right now,
                    and I wasn't pressured."
```

**Runtime implications (what this psychology forces at the architecture level, extending Step 0A rather than restating it):**
```
- The 20/80 Transaction/Relationship split is not a stylistic
  preference — it is the direct reason this build's Decision Tree
  (§5) treats "no conversion this time" as a NORMAL, frequent, non-
  failure outcome, unlike Commerce's Decision Tree where an
  unconverted cart is explicitly framed as an open opportunity to
  recover. A passive-supporter conversation that produces zero
  conversion is architecturally equal in standing to a Donate
  conversion, not a lesser outcome (Step 0A Employee Mindset: "never
  treating 'just attending' as a lesser outcome than donating" —
  extended here to "never attending at all" as equally legitimate).
- Freedom Level 4/10 (Step 2) combined with a High discovery tolerance
  means the agent has real latitude to explore mission-fit
  conversationally, but Step 2's freedom table still caps proactive
  recommendation and challenge-authority at this band — the agent
  guides toward a contribution type once signaled, it does not
  unilaterally decide which type "makes sense" for the customer
  (Step 2 §3 worked example: refuses to argue against a competing
  cause, redirects to concrete impact instead).
- Because true "Ready" is a minority state (per Buying Readiness
  above), this build's trust-building gate (§5, design question 4)
  is signal-based rather than turn-count-based — a fixed number of
  turns would either rush genuinely skeptical customers (damaging
  the relationship, per Step 0A "what causes disengagement") or
  artificially delay customers who arrive already ready to act.
- Impact-skepticism as the DEFAULT posture is the direct reason this
  build's legitimacy-question handling (§8) treats "is this a real
  charity" as an expected, routine message type — not an edge case
  requiring special escalation, just a transparency-first factual
  response (Core Agent FAQ, Business-Memory-backed).
```

---

#### 2. Common Entry Scenarios

15 realistic opening messages, deliberately distributed across all three conversion types AND the passive-supporter case (not weighted toward Donate). [Owner tags per the Module Responsibility Contract, Step 1D.0.5.]

```
DONATE-SIGNALING (4):

1. "what does your organization actually do with donations"
   Signals: Skeptical/exploring, wants specifics before any ask. →
   [Owner: Core Agent FAQ / Growth Agent] — concrete impact info,
   trust-building phase (§5), no ask yet.

2. "I want to set up a monthly donation"
   Signals: Ready Buyer, explicit Donate intent, skip trust-building
   gate entirely (design question 4). → [Owner: Conversion Engine,
   Donate Mode A/B directly]

3. "I'd like to give $100 in memory of my father"
   Signals: Tribute/memorial donation, dual-identity data need. →
   [Owner: Conversion Engine, Donate — Tribute sub-flow] — see Data
   Collection Timing §4 (resolves design question 8).

4. "can you check if my last donation went through, I never got a
   receipt"
   Signals: Recurring donor, existing-transaction support issue,
   Intent 04. → [Owner: Core Agent Support Handler, Module 1 B] — NOT
   a new-donation flow (design question 7, §5).

VOLUNTEER-SIGNALING (4):

5. "I don't have money to give but I have time on weekends"
   Signals: Clear capacity signal (time, not money) — must route to
   Volunteer, not a donation ask (Step 0A Common Conversation Pattern
   3). → [Owner: Growth Agent, Volunteer path]

6. "what volunteer opportunities do you have for someone with graphic
   design skills"
   Signals: Skills-specific volunteer matching request. → [Owner:
   Growth Agent, Volunteer Confidence Gate] — see Decision Tree §5
   (resolves design question 2).

7. "I want to volunteer every Saturday starting next month"
   Signals: Ready Buyer, explicit Volunteer intent with availability
   already stated. → [Owner: Conversion Engine, Volunteer Mode A/B
   directly, trust-building gate skipped]

8. "do you need volunteers for the food drive next week"
   Signals: Specific, time-bound program inquiry — tests whether
   Business Memory actually confirms this program is active. →
   [Owner: Growth Agent/Conversion Engine] — see Decision Tree §5
   (resolves design question 6, program-not-active handling).

ATTEND-SIGNALING (3):

9. "I saw your event on instagram, how do I get involved"
   Signals: Externally triggered interest, open to multiple
   contribution types — needs matching, not a default donate-now
   pitch (Step 0A Common Conversation Pattern 2). → [Owner: Growth
   Agent, Discovery]

10. "just want to know when the next event is"
    Signals: Passive supporter / low commitment — answer directly,
    leave door open, do not force a bigger conversion (Step 0A Common
    Conversation Pattern 5). → [Owner: Core Agent FAQ, then Passive
    Supporter path if the conversation stays at this level] — see
    Decision Tree §5 (resolves design question 5).

11. "can I bring my kids to the fundraiser gala"
    Signals: Attend-specific logistics question, Ready-adjacent. →
    [Owner: Growth Agent → Conversion Engine, Attend Mode A/B]

PASSIVE SUPPORTER / MIXED / EDGE (4):

12. "is this a legit charity"
    Signals: Low trust, legitimacy-testing — transparency response,
    not enthusiasm (Step 0A Common Conversation Pattern 4). → [Owner:
    Core Agent FAQ] — routine, expected message type (§8), not a
    special escalation.

13. "do you offer scholarships and also how do I sign up to volunteer"
    Signals: Two components in one message — an informational/
    donate-adjacent question plus a distinct Volunteer registration
    intent. → [Owner: Core Agent FAQ for the informational component,
    then Growth Agent/Conversion Engine for Volunteer] — per Step 1F,
    both answered, only Volunteer proceeds toward an actual
    registration action this turn (matches Stress Test MI-04's
    expected handling exactly).

14. "we're already supporting a cause we love, just wanted to learn
    more about you for now"
    Signals: Explicit passive-supporter signal, low near-term
    conversion likelihood stated directly. → [Owner: Growth Agent →
    Passive Supporter path] — see Decision Tree §5, treated as a
    first-class success path, not a lesser outcome (design question
    5).

15. "we don't run that program anymore right, or is it still going"
    Signals: Program-status uncertainty, possible program-not-active
    case. → [Owner: Core Agent FAQ, Business-Memory-confirmed answer
    only] — see Decision Tree §5 (resolves design question 6).
```

---

#### 3. Full Conversation Journey Map

Per the instructions, this archetype does not get one universal journey map — a shared Entry/Trust-Building opening feeds into four fully-specified paths (Donate, Volunteer, Attend, Passive Supporter), each detailed on its own.

##### Shared Entry / Trust-Building Opening

```
Customer message received
↓
1A Session State Check (New / Returning Lead / Existing Customer /
   Dormant Customer)
↓
1B Intent Classification
↓
Intent 04 (existing donor/volunteer record — status check, receipt,
   record correction) detected?
  YES → [Owner: Core Agent, Module 1 B] — full handoff, Engagement
        flow stands down for this conversation (design question 7,
        §5).
  NO  → continue
↓
Intent 05 (complaint/legitimacy-attack, distinct from a routine
   legitimacy QUESTION — see §8) detected?
  YES → [Owner: Core Agent Complaint Handler, Module 1 C]
  NO  → continue
↓
Trust-Building Gate (design question 4): has the customer already
   given an explicit, Ready-level signal for a specific conversion
   type (e.g., "I want to set up a monthly donation," "sign me up to
   volunteer Saturdays")?
  YES → [Owner: hands directly to that type's Conversion Path,
        skipping trust-building entirely — Module 2 EC-01 pattern,
        reused not reinvented: a Ready signal always outranks a
        discovery/trust-building sequence the customer didn't ask for]
  NO  → [Owner: Growth Agent] Trust-Building exchange: share SPECIFIC,
        concrete impact information (never generic mission statements,
        Step 0A "what creates confidence") in response to whatever the
        customer actually asked
↓
Capacity/Interest Signal Check (evaluated fresh after every exchange,
   not on a fixed turn count — design question 4):
  Donate signal (money-oriented language, or explicit "how do I give")
    → [Owner: Growth Agent] Donate Journey (below)
  Volunteer signal (time/skills-oriented language)
    → [Owner: Growth Agent] Volunteer Journey (below)
  Attend signal (event-oriented language)
    → [Owner: Growth Agent] Attend Journey (below)
  No type signaled, customer stays at information/interest level after
   a reasonable exchange
    → [Owner: Growth Agent] Passive Supporter Journey (below) — a
      DESIGNED destination, not a default/timeout state
```

##### Donate Journey

```
Entry: Donate signal detected (shared opening) or explicit Ready
   signal (trust-building skipped).
↓
Tribute/memorial donation? ("in memory of," "in honor of")
  YES → Tribute sub-flow: donor identity (Tier 3) + honoree name
        (Tier 3, required) + honoree contact (Tier 3, OPTIONAL — only
        if a notification/card is requested) — see Data Collection
        Timing §4 (resolves design question 8).
  NO  → standard Donate data collection.
↓
Donation Ask Calibration (design question 3, §5 Donate Decision Tree)
   — [Owner: Growth Agent] — ask offered only once genuine mission-fit
   is understood, framed as one option among several, never a bare
   "would you like to donate?"
↓
Action Permission Check (1D.1) — registration/donation permission
   granted for this type?
  YES → Mode A (Direct Registration)
  NO  → Mode B (Guided to Form)
↓
Tier 3 data collection (§4) — [Owner: Conversion Engine, Module 3 §4]
↓
Registration/donation confirmed
↓
Step 1G Exit: End State 1 (Confirmed) or End State 2 (Mode B, link
   sent, no in-session confirmation)
```

##### Volunteer Journey

```
Entry: Volunteer signal detected (shared opening) or explicit Ready
   signal (trust-building skipped).
↓
Volunteer Matching Confidence Gate (design question 2, §5 Volunteer
   Decision Tree) — [Owner: Growth Agent] — does Business Memory
   contain CURRENT program/capacity data matching the customer's
   stated skills/availability?
  HIGH confidence (specific, current match confirmed) → state the
        specific match plainly.
  LOW/MEDIUM confidence (no live capacity data, or only a general
        program list) → do NOT claim a confirmed slot exists; name the
        gap honestly, route toward Mode C (human coordinator
        confirmation) rather than a fabricated match.
↓
Action Permission Check (1D.1) — registration permission granted for
   Volunteer?
  YES → Mode A (Direct Registration)
  NO  → Mode B (Guided to Form)
        (Low-confidence match cases route to Mode C regardless of this
        permission check, per the Confidence Gate finding above.)
↓
Tier 3 data collection (§4) — [Owner: Conversion Engine, Module 3 §4]
↓
Registration confirmed
↓
Step 1G Exit: End State 1, End State 2 (Mode B), or End State 5
   (Mode C, low-confidence match)
```

##### Attend Journey

```
Entry: Attend signal detected (shared opening) or explicit Ready
   signal (trust-building skipped).
↓
Program/event currently active and confirmed in Business Memory?
   (design question 6, §5)
  NO  → Program-Not-Active branch: honest disclosure, closest
        available alternative if one exists, gentle handling of
        emotional letdown (Step 0A edge case) — never implies the
        event exists if Business Memory doesn't confirm it (Step 0C
        Level 3).
  YES → continue
↓
Action Permission Check (1D.1) — registration permission granted for
   Attend?
  YES → Mode A (Direct Registration)
  NO  → Mode B (Guided to Form)
↓
Tier 3 data collection (§4) — [Owner: Conversion Engine, Module 3 §4]
↓
Registration confirmed
↓
Step 1G Exit: End State 1 or End State 2 (Mode B)
```

##### Passive Supporter Journey (first-class path, not a fallback)

```
Entry: No type signaled after a reasonable trust-building exchange
   (shared opening), OR an explicit passive-supporter statement (Entry
   Scenario 14).
↓
[Owner: Growth Agent — Employee Mindset: "mission ambassador, not
   fundraiser," per Step 0A]
1. Answer whatever was actually asked, with the same specific,
   concrete-impact standard as the trust-building exchange — a
   passive supporter's questions are not treated as lower-priority
   than a Ready buyer's.
2. Offer ONE low-commitment, genuinely optional next step (e.g., "want
   me to keep you posted on upcoming events?") — a Tier 1/2-level
   capture, NOT a Module 3 conversion action (design question 5 — see
   Recovery Trigger Moments §7 for why this is deliberately excluded
   from Conversion Engine).
3. Do not re-offer a bigger ask (Donate/Volunteer/Attend) if the
   customer doesn't pick it up — per Step 0A "what causes
   disengagement," a passive supporter who feels pursued after
   declining to escalate is a worse outcome than one who simply
   leaves with accurate information.
↓
SUCCESS CRITERIA for this path (explicit, per design question 5):
   The customer leaves with an accurate understanding of the mission,
   was never pressured, and has a standing low-commitment door left
   open — this is TRUE SUCCESS even with zero conversion, not a
   degraded outcome. Step 1G End State 1 (Successful Completion)
   applies here exactly as it would for a completed donation — the
   interaction's job (honest, specific engagement) was completed.
↓
Step 1G Exit: End State 1 (Successful Completion) — NOT End State 2
   (Open Opportunity) by default, since treating every passive
   supporter as something to chase would defeat the entire point of
   this path (see §7 for the long-term ownership resolution).
```

---

#### 4. Data Collection Timing

Applying Step 0B doctrine and the Step 0B §7 Data Validation Layer to Engagement, with the discipline this build's instructions require: each conversion type gets its own Tier 2 trigger CONTENT, not a shared generic "program-match offer" label.

```
Shared framework: Tier 2 (Value Exchange Capture) primary, Tier 3
  (Commitment Capture) secondary — per Step 0B §4's Per-Archetype
  Collection Mapping Table. Mission-aligned framing required
  throughout (Step 0B §4 Special Rules: "the ask must read as helping
  the customer act on their interest, not as list-building").
```

**Donate — Tier 2 trigger content (distinct value-exchange moment):**
```
Trigger: Once genuine mission-fit is understood (Donation Ask
  Calibration, §5) — NOT at first mention of money.
Agent: "If it's helpful, I can send you a quick summary of exactly
  where a gift like this goes — want me to?" (email captured as the
  value exchange, distinct from asking for the gift itself).
Tier 3 (at actual donation): customer_name, customer_email or
  customer_phone, donation_amount/frequency (if a specific figure is
  given), payment handled by the registration integration itself, not
  the agent — same separation-of-concerns as Commerce Ecom Mode A's
  payment/checkout-link boundary.
```

**Volunteer — Tier 2 trigger content (distinct value-exchange moment):**
```
Trigger: Once the customer's stated skills/availability are
  understood (not at first mention of "I have time").
Agent: "I can check what's currently open that fits [stated
  availability/skills] and send you the details — what's the best
  email?" — the value exchanged is a genuine, specific-to-them check,
  not a generic newsletter signup.
Tier 3 (at actual registration): customer_name, contact method,
  availability, skills/interest area — collected together at
  registration, per Module 3 §4's existing Engagement Mode A row.
```

**Attend — Tier 2 trigger content (distinct value-exchange moment):**
```
Trigger: Once a specific event is identified as relevant to the
  customer (not at first mention of any event).
Agent: "Want me to save you a spot / send you the RSVP details for
  [specific event]?" — tied to the exact event discussed, never a
  generic "stay updated on our events" ask at this tier.
Tier 3 (at actual registration): customer_name, contact method, event
  selection, party size if applicable.
```

**Passive Supporter — capture pattern (deliberately Tier 1/2 only, never Tier 3):**
```
Trigger: The single low-commitment offer made in the Passive Supporter
  Journey (§3) — "want me to keep you posted on upcoming events?"
Field collected: email only, if accepted — this is the ENTIRE data
  footprint of this path. No name, no phone, no Module 3 registration
  fields, because no Module 3 conversion action ever fires for this
  path (§7 explains why this is deliberately kept outside Conversion
  Engine's scope).
If declined: no capture at all, no re-ask, no pressure — accepted
  immediately per Step 0B Universal Prohibitions and the Passive
  Supporter Journey's own success criteria (§3).
```

**Gift/Tribute Donations — dual-identity structure (design question 8, adapted from Commerce's gift-purchase resolution):**
```
Structurally similar to Commerce Ecommerce's gift-purchase dual
capture (two distinct, separately-framed moments, donor first) — but
genuinely adapted, not copied, because the SECOND identity's data need
is different:

Commerce gift purchase: recipient needs a shipping address (contact
  info always required, since the item must physically arrive).

Engagement tribute donation: honoree needs a NAME (always required,
  for the donation record — "in memory of [name]" / "in honor of
  [name]"), but honoree CONTACT INFO is only needed if the donor
  additionally wants a notification/card sent to a living honoree —
  this is optional and conditional, not a standing second requirement.

Capture sequence:
  1. Donor's info first (Tier 3, standard Donate flow) — name +
     payment-relevant contact, framed as completing the donor's own
     transaction/receipt.
  2. Honoree name second (Tier 3, REQUIRED for any tribute donation) —
     "Who is this gift in honor of / in memory of?"
  3. Honoree contact (Tier 3, OPTIONAL, only if requested) — "Would
     you like us to send a card letting them know? If so, I'll just
     need their address or email." If declined, the donation proceeds
     with just the honoree's name on record — this is a complete,
     valid tribute donation, not a partial one.

Rule: Step 3's honoree-contact ask is never presented as required —
  presenting it as mandatory would misrepresent what the transaction
  actually needs, violating Step 0B Universal Prohibition 6 ("collects
  a field it has no immediate, stated use for").
```

**Backend submission gate:** Per Step 0B §7.4, no Donate/Volunteer/Attend registration fires until its specific Tier 3 fields are VALID or INVALID-FLAGGED — consistent with every prior archetype build. The Passive Supporter path has no backend submission gate to speak of, since it never reaches Module 3's Conversion State Machine at all (§7).

---

#### 5. Decision Tree

Per the instructions, one tree per conversion type is clearer than forcing a single universal tree — this build provides a shared Entry/Capacity-Routing tree (handling the cross-cutting questions: existing-donor handoff, trust-building gate, passive-supporter branch) followed by three per-type trees. All conditions carry explicit YES/NO branches. No dead ends. [Owner] tags applied per the Module Responsibility Contract (Step 1D.0.5).

##### Shared Entry / Capacity-Routing Decision Tree

```
MESSAGE RECEIVED
↓
IS THIS INTENT 04 (EXISTING DONOR/VOLUNTEER RECORD — STATUS, RECEIPT,
CORRECTION)? (design question 7 — the key ownership boundary for this
archetype)
  YES → [Owner: Core Agent Support Handler, Module 1 B] — full
        ownership transfer at intake, same pattern as Commerce's
        "returning customer with order issue" and Appointment's
        reschedule/cancel resolutions. No parallel donor-history logic
        is built inside this archetype.
  NO  → continue
        ↓
IS THIS A COMPLAINT / TRUST-BROKEN SIGNAL? (Intent 05, Universal
Psychology Override — distinct from a routine legitimacy QUESTION,
see §8)
  YES → [Owner: Core Agent Complaint Handler, Module 1 C]
  NO  → continue
        ↓
DOES THE CUSTOMER ALREADY GIVE AN EXPLICIT, READY-LEVEL SIGNAL FOR A
SPECIFIC CONVERSION TYPE? (design question 4 — Trust-Building Gate)
  YES → [Owner: hands directly to that type's Decision Tree below,
        skipping trust-building entirely] — Module 2 EC-01 pattern
        reused, not reinvented: "no requirement that Discovery run
        before every conversion" applies identically here.
  NO  → continue
        ↓
[Owner: Growth Agent] TRUST-BUILDING EXCHANGE: answer with specific,
concrete impact information tied to what was actually asked (Step 0A
"what creates confidence") — no ask of any kind yet.
        ↓
AFTER THIS EXCHANGE, DOES A CAPACITY/INTEREST SIGNAL NOW EXIST?
(re-evaluated after every exchange, not on a fixed turn count — design
question 4's signal-based resolution)
  Donate signal    → Donate Decision Tree (below)
  Volunteer signal → Volunteer Decision Tree (below)
  Attend signal    → Attend Decision Tree (below)
  No signal, customer stays at information level →
        [Owner: Growth Agent] PASSIVE SUPPORTER PATH (design question
        5) — this is not a "still no" holding pattern, it is the
        correct, final routing decision for this conversation. Proceed
        per §3's Passive Supporter Journey; re-evaluate this same
        check again only if the customer's OWN next message introduces
        a new signal — the agent does not re-probe for one.
```

##### Donate Decision Tree

```
ENTRY: Donate signal confirmed (shared tree) or explicit Ready signal.
↓
IS THIS A TRIBUTE/MEMORIAL DONATION? ("in memory of," "in honor of")
  YES → Tribute sub-flow (§4, design question 8): donor Tier 3 →
        honoree name (Tier 3, required) → honoree contact (Tier 3,
        OPTIONAL, only if a notification is requested).
  NO  → continue
        ↓
HAS GENUINE MISSION-FIT BEEN ESTABLISHED? (design question 3 —
Donation Ask Calibration, applying Growth Agent's Recommendation
Confidence Requirement pattern to the donation-ask moment specifically)
  NO  → [Owner: Growth Agent] Continue trust-building / discovery —
        do NOT make a donation ask yet, regardless of how much freedom
        the configured band would technically permit (Step 2 §2.3
        Discovery Budget Rule: "permission to ask is not a requirement
        to ask").
  YES → [Owner: Growth Agent] Make the ask using the calibrated
        pattern (below) — never a bare "would you like to donate?"
        ↓
        CALIBRATED ASK PATTERN (concrete language, resolving design
        question 3):
          "If you'd like, there are a couple of ways to help beyond
          just learning about this — a one-time or monthly gift is
          one option, but so is signing up to stay in the loop first
          if you're not ready for that. No pressure either way."
          — the ask is offered ALONGSIDE a genuine non-ask option
          (Tier 2 update signup / Passive Supporter path), never as a
          binary yes/no on money alone. This is the concrete
          translation of Step 0A's abstract "never pressure" principle
          this design question required.
↓
CUSTOMER RESPONDS POSITIVELY TO THE ASK?
  NO (declines, or picks the non-ask option) → route to Passive
        Supporter Journey (§3) — a declined ask is NOT a failed
        conversation, per §1's runtime implication that "no conversion
        this time" is a normal outcome here.
  YES → continue
        ↓
ACTION PERMISSION CHECK (1D.1): donation registration permission
granted?
  YES → Mode A (Direct Registration)
  NO  → Mode B (Guided to Form)
↓
TIER 3 FIELDS VALID OR INVALID-FLAGGED? (Step 0B §7.4)
  NO  → Correction Flow (§7.3) — one flag, one re-attempt, accept-
        with-flag.
  YES → Proceed to ACTION_PENDING → CONFIRMED (Module 3 §1.1).
↓
Step 1G Exit
```

##### Volunteer Decision Tree

```
ENTRY: Volunteer signal confirmed (shared tree) or explicit Ready
signal.
↓
DOES BUSINESS MEMORY CONTAIN CURRENT, LIVE PROGRAM/CAPACITY DATA
MATCHING THE CUSTOMER'S STATED SKILLS/AVAILABILITY? (design question 2
— Volunteer Matching Confidence Gate, per Step 1D.2)
  HIGH CONFIDENCE (specific match confirmed) → [Owner: Growth Agent]
        State the specific match plainly: "We actually have a
        [specific role] on [specific day/time] that fits what you
        described — want me to get you signed up?"
  MEDIUM/LOW CONFIDENCE (general program list only, no live capacity,
  or Business Memory silent on current openings) → [Owner: Growth
        Agent] Do NOT claim a confirmed slot exists — name the gap
        honestly, same pattern as Growth Agent's No Suitable
        Recommendation Handling (Module 2 B.1): "I don't have current
        openings confirmed for [skill/day] specifically, but I don't
        want to guess and get your hopes up on something that might
        not be available — let me connect you with our volunteer
        coordinator to confirm what's actually open." → routes to Mode
        C regardless of the Action Permission Check below.
  CONFLICTING (Business Memory shows contradictory program status) →
        Treated identically to LOW confidence per Step 1D.2's existing
        Confidence Gate rule — never resolved by guessing.
↓
(HIGH CONFIDENCE PATH CONTINUES:)
ACTION PERMISSION CHECK (1D.1): volunteer registration permission
granted?
  YES → Mode A (Direct Registration)
  NO  → Mode B (Guided to Form)
↓
TIER 3 FIELDS VALID OR INVALID-FLAGGED? (Step 0B §7.4)
  NO  → Correction Flow (§7.3).
  YES → Proceed to ACTION_PENDING → CONFIRMED (Module 3 §1.1).
↓
(LOW/MEDIUM/CONFLICTING CONFIDENCE PATH:)
Mode C (Human Handoff) — capture Tier 3 contact fields framed around
the customer's specific stated interest, route to Human Handoff
Handler, Priority 3 (Review) — a matching/capacity gap, not urgent.
↓
Step 1G Exit
```

##### Attend Decision Tree

```
ENTRY: Attend signal confirmed (shared tree) or explicit Ready signal.
↓
IS THE SPECIFIC EVENT/PROGRAM CURRENTLY ACTIVE AND CONFIRMED IN
BUSINESS MEMORY? (design question 6 — Program/campaign not currently
active)
  NO  → [Owner: Core Agent FAQ] PROGRAM-NOT-ACTIVE BRANCH: "That one
        isn't currently running — I don't want to point you toward
        something that isn't actually happening." Then:
          Closest available alternative exists in Business Memory? →
            Offer it explicitly, disclosed as an alternative, not a
            substitute presented as the same thing (same disclosure
            discipline as Commerce's out-of-stock alternative
            handling).
          No alternative exists? → Offer a reactivation notification
            (Tier 2 capture, config-gated per
            `program_reactivation_notification_enabled` — see
            Appendix A) — "Want me to let you know if that comes back
            around?" — mirroring Commerce Ecom's back-in-stock
            notification pattern, adapted here.
          Either way: handled gently, per Step 0A's edge case that the
            customer's emotional investment is already engaged —
            never a flat "not available," always paired with a next
            step.
        → routes to Passive Supporter Journey (§3) if no alternative
          and no notification accepted, since no conversion is
          possible this turn.
  YES → continue
        ↓
ACTION PERMISSION CHECK (1D.1): event registration permission granted?
  YES → Mode A (Direct Registration)
  NO  → Mode B (Guided to Form)
↓
TIER 3 FIELDS VALID OR INVALID-FLAGGED? (Step 0B §7.4)
  NO  → Correction Flow (§7.3).
  YES → Proceed to ACTION_PENDING → CONFIRMED (Module 3 §1.1).
↓
Step 1G Exit
```

---

#### 6. Conversion Path

Full flow for Engagement's three Conversion Engine modes (per Step 3 Module 3, applied at the archetype level, per conversion type), presented per the Universal Mode Naming (Batch 3): Agentic Completion (A) / Assisted Capture-or-Guided External Completion (B) / Human Handoff (C). Module 3's Engagement section already defines Mode A/B/C generically across all three types — this section shows each type's actual application, per this build's requirement that each type get genuinely distinct treatment, not a shared label.

**Mode A — Agentic Completion (Direct Registration), per type:**
```
Donate:    Entry: donation registration permission granted (1D.1).
           Confirm contribution type/amount/frequency, complete
           registration, collect Tier 3 fields as part of completing
           it — mission-aligned framing (Step 0B): "I'll get this set
           up — what's the best email to send confirmation to?"
           Tribute donations additionally confirm honoree name (and
           contact, if requested) before completing (§4).
           Exit: Step 1G End State 1.

Volunteer: Entry: volunteer registration permission granted (1D.1) AND
           HIGH confidence match already established (§5). Confirm
           the specific role/day/time, complete registration, collect
           Tier 3 fields (name, contact, availability, skills).
           Exit: Step 1G End State 1.

Attend:    Entry: event registration permission granted (1D.1) AND
           event confirmed active (§5). Confirm event/date/party size,
           complete registration, collect Tier 3 fields.
           Exit: Step 1G End State 1.
```

**Capacity verification note (Volunteer/Attend, applies to both):** No
live program/event-capacity feed exists in v1 to independently verify
capacity beyond the §5 Confidence Gate's confidence tiering (Module 3
§2.1's v1 Fallback Configuration). Under
`client_config.engagement_capacity_check_mode = "dashboard_request"`
(v1-safe default), registration completes as a *pending* request — the
agent still uses the completion language above, but frames it as
submitted-pending-confirmation rather than fully confirmed ("I've got
your request in — you'll get a confirmation shortly" rather than "you're
all set"), and a human confirms actual capacity before it becomes a
real registration. Under `"direct_confirm"` mode, the flow above applies
exactly as written and the client accepts the reduced verification.

**Mode B — Assisted Capture / Guided External Completion (Guided to Form), per type:**
```
Donate:    Entry: no direct donation-registration integration exists.
           Provide a direct, specific link to the donation form for
           the exact type/amount context discussed — never a generic
           "donate" homepage link (Step 0A "generic responses"
           disengagement trigger, applied here as it is in Commerce).
           Exit: Step 1G End State 2 unless in-session completion
           confirmed.

Volunteer: Entry: no direct volunteer-registration integration exists
           (and this is NOT the low-confidence-match case, which
           routes to Mode C instead — see §5). Direct link to the
           specific volunteer sign-up page for the matched role.
           Exit: Step 1G End State 2 unless in-session completion
           confirmed.

Attend:    Entry: no direct event-registration integration exists.
           Direct link to the specific event's RSVP/registration page.
           Exit: Step 1G End State 2 unless in-session completion
           confirmed.
```

**Mode C — Human Handoff, per type:**
```
Donate:    Trigger: request doesn't cleanly fit standard donation flow
           (e.g., major-gift or planned-giving inquiry, per Module 3's
           existing Engagement Mode C trigger). Capture Tier 3 fields,
           route to Human Handoff Handler, Priority 3 (Review) unless
           the inquiry itself signals urgency.

Volunteer: Trigger: LOW/MEDIUM/CONFLICTING confidence match (§5,
           design question 2) — this is Volunteer's PRIMARY Mode C
           trigger in practice, distinct from the generic "doesn't fit
           the type" trigger Module 3 defines archetype-wide. Capture
           Tier 3 fields framed around the customer's specific stated
           interest, route to Human Handoff Handler, Priority 3
           (Review) — a matching gap, not urgent.

Attend:    Trigger: request doesn't cleanly fit (e.g., a partnership/
           sponsorship inquiry framed as "attending"), OR the
           Program-Not-Active branch (§5) produces neither an
           alternative nor an accepted notification and the customer
           explicitly wants a person. Capture Tier 3 fields, route to
           Human Handoff Handler, Priority 3 (Review).
```

**Passive Supporter path — deliberately outside this section:** No Conversion Engine mode ever fires for the Passive Supporter path (§3, §4) — it exits at Step 1G End State 1 directly from Growth Agent ownership, per the Module Ownership Contract (Conversion Engine "OWNS: Completing the specific transaction action... once Intent 03 is confirmed" — a passive supporter never confirms Intent 03 for any type, so Conversion Engine has nothing to own here).

---

#### 7. Recovery Trigger Moments

Exact triggers and non-triggers, per Module 4 applied specifically to Engagement. Per the instructions, this section uses Module 4's existing Engagement trigger definition and cadence exactly as specified — including the cadence's own "approved, but no corresponding n8n workflow built yet" status — without attempting to resolve that infrastructure-build question.

```
RECOVERY TRIGGER (exact moment, per Module 4 §2):
  Program/contribution type matched, no registration completed. This
  applies identically across Donate/Volunteer/Attend — Module 4 does
  not currently define separate per-type triggers, and this build does
  not add any (Module 4's own text is not redefined, per Rule 2).

RECOVERY PROFILE: Engagement — 1 day → 7 days → 21 days, 3 steps, per
  Module 4 §3 — approved, but with no corresponding n8n workflow
  built yet (future WF-105). Used exactly as specified; this build
  takes no position on whether/when that infrastructure gets built.

Tone: Mission-aligned, patient — "when the timing is right, we're
  here" framing (Module 4 §4 tone rules, applied as-is).
```

**Passive Supporter long-term ownership (Module Ownership Contract requirement — genuinely unresolved by either module's existing definition, resolved here with judgment):**

```
The question: does a passive supporter's ongoing light-touch
relationship belong to Growth Agent (ongoing relationship-building) or
eventually become a Recovery Engine case?

RESOLUTION: Neither module owns this in a continuous/background sense
— the question itself assumes an ongoing-cadence owner must exist, and
that assumption doesn't hold up against either module's actual
Ownership Contract:

  Growth Agent (Module 2) only operates within a LIVE conversation —
  its OWNS/ALLOWED/DOES NOT OWN/MUST TRANSFER contract (Step 1D.0.5)
  defines no mechanism for initiating contact outside an active
  session. There is no "Growth Agent, dormant mode" — when the
  conversation ends, Growth Agent's involvement ends with it.

  Recovery Engine (Module 4) structurally CANNOT own this either — its
  own trigger definition (§2 above, unmodified) requires a "program/
  contribution type matched" before a recovery record is created. A
  genuine passive supporter (Entry Scenario 14, the Passive Supporter
  Journey in §3) never matches a type — that is the entire point of
  this path. Forcing a passive supporter into Recovery Engine's
  cadence machinery would be a category error: Recovery Engine's tone
  model (Module 4 §4) and Reply Handling (§6.1) are built around
  "recovering an abandoned decision," and a passive supporter never
  had a decision in progress to abandon.

  What actually happens: if the supporter accepted the one Tier 2
  low-commitment offer (§3, §4 — "keep you posted on upcoming
  events"), that email is a Business Memory/CRM-level opt-in for
  GENERAL outbound communications (newsletter/updates), delivered by
  Email Manager's outbound execution layer (Module 5 §7 Outbound
  Scope) as ordinary business-configured content — not a Growth
  cadence, not a Recovery cadence, and not something this runtime
  document further specifies (consistent with Module 5 §7.1's existing
  Outbound Campaign Boundary already drawing a line around what
  automated outbound this document does and doesn't own).

  When the supporter LATER returns and initiates a new conversation
  (asks a new question, signals new interest), Step 1A classifies them
  as a Returning Lead and Growth Agent engages FRESH — with no
  memory-driven pressure referencing how long it's been or how many
  times they've been nurtured (Step 0C §4 Privacy Boundaries: never
  reference frequency/tracking-style detail back to the customer).
  This mirrors Module 4 §6.1's "a recovery reply starts a new
  conversation, not a resumed cadence" principle by analogy, even
  though a passive supporter's return isn't technically a recovery
  reply.

  Net effect: "long-term ownership" is a false premise for this case —
  ownership is deliberately non-continuous. Each live conversation is
  owned by whichever module Step 1D routes it to at that moment; the
  only thing that persists between conversations is an opt-in mailing
  preference, which belongs to neither Growth Agent nor Recovery
  Engine.
```

**Non-triggers (specific to Engagement, extending Module 4 §2's universal list with archetype application, not new rules):**
```
- Passive Supporter path outcomes (§3) — never Recovery-eligible, per
  the resolution above; Module 4's own trigger definition already
  excludes this case without any change needed.
- Program-Not-Active branch (§5, Attend) where a reactivation
  notification was accepted — this is NOT a Recovery Engine case, same
  reasoning as Commerce Ecom's back-in-stock notification: the
  notification itself is the follow-up mechanism; a parallel Recovery
  cadence on top of it would be a duplicate-contact problem (Module 3
  §1.2 Duplicate Action Protection principle, applied to follow-up
  mechanisms).
- Mode C (Human Handoff) outcomes across all three types — Step 1G
  End State 5, no recovery record while a human owns the conversation
  (Module 4 §2 non-trigger list).
```

---

#### 8. Escalation Boundaries

All triggers with exact agent behavior on detection, applying Module 1's existing Escalation Priority Classification (P1/P2/P3) — not reinvented here.

```
TRIGGER: Complaint / trust-broken signal (Intent 05)
  Behavior: Core Agent Complaint Handler (Module 1 C) takes the
  conversation first; Engagement flow stands down. Priority per
  Module 1 D's existing classification.

TRIGGER: Routine legitimacy question ("is this a real charity")
  Behavior: NOT an escalation trigger — per §1's runtime implication
  (impact-skepticism is the DEFAULT posture, not the exception), this
  is a routine, expected message type. Core Agent FAQ / Growth Agent
  answers factually from Business Memory (transparency-first, per Step
  0A "what creates confidence"). Only escalates if the specific answer
  isn't confirmable in Business Memory, per the standard Confidence
  Gate/2-clarification-attempt pattern (Module 1 A) — same treatment
  as any other unanswerable factual question, no special Engagement
  rule invented.

TRIGGER: Volunteer matching Confidence Gate returns Low/Medium/
  Conflicting (§5, design question 2)
  Behavior: Mode C, Priority 3 (Review) — a matching/capacity gap, not
  urgent; this is Volunteer's primary escalation path in practice.

TRIGGER: Program-Not-Active branch exhausted (no alternative, no
  accepted notification, customer wants a person) (§5, design
  question 6)
  Behavior: Mode C, Priority 3 (Review) — informational/logistics gap,
  not urgent.

TRIGGER: Major-gift, planned-giving, partnership, or sponsorship
  inquiry that doesn't fit Donate/Volunteer/Attend cleanly
  Behavior: Mode C per Module 3's existing Engagement Mode C trigger,
  Priority 3 (Review) unless the inquiry itself signals urgency (e.g.,
  a time-bound matching-gift deadline) — same escalation-priority
  logic applied elsewhere in this document (urgency is evaluated
  independently of the trigger type itself).

TRIGGER: Confidence Gate (1D.2) Low/Conflicting on a factual question
  about where donations/time actually go
  Behavior: Per Step 0C ("never override business data with
  assumptions"), the agent does not guess or reassure vaguely.
  Clarification attempt (max 2, Module 1 A) then Human Handoff Handler
  at Priority 3 — a vague or fabricated impact claim would directly
  contradict this archetype's core trust mechanism (Step 0A "what
  creates confidence": specific, concrete impact information).

TRIGGER: Existing donor/volunteer record request requiring
  verification beyond Zero-Verification tier (§5, design question 7)
  Behavior: Per Module 1 B's Customer Verification Rule, a donation-
  history or personal-data request is at minimum Low-Risk (confirm one
  known identifier); Core Agent applies its own existing verification
  tiers, not a new Engagement-specific rule.
```

---

**Engagement — Design Decisions Summary (all 8 resolved):**
```
1. Three distinct sub-flows — structural requirement satisfied by this
   build's shape itself: Donate/Volunteer/Attend each have their own
   Journey Map (§3), Tier 2 trigger content (§4), Decision Tree (§5),
   and Mode A/B/C application (§6) — not one flow with a swapped label.
   Confirmed genuinely distinct: Donate's Tier 2 offer is a specificity
   summary, Volunteer's is a personalized capacity check, Attend's is
   an event-specific RSVP save — three different value exchanges, not
   the same sentence with a noun swapped.
2. Volunteer matching depth — resolved via the existing Confidence
   Gate (1D.2): HIGH confidence (live capacity data confirms a match)
   states it plainly; LOW/MEDIUM/CONFLICTING routes to Mode C rather
   than guessing, reusing Growth Agent's No Suitable Recommendation
   Handling (B.1) pattern rather than inventing new honesty logic —
   §5, §6.
3. Donation ask calibration — concrete calibrated language defined
   (§5): the ask is offered alongside a genuine non-ask option, never
   a binary yes/no on money, gated behind Growth Agent's Recommendation
   Confidence Requirement pattern (genuine mission-fit understood
   first) — §5.
4. Trust-building phase duration — resolved as signal-based, not
   turn-count-based: re-evaluated after every exchange for a capacity/
   interest signal, with an explicit skip path for customers who
   arrive already Ready (reusing Module 2 EC-01, not reinventing) —
   §3, §5.
5. Passive supporter path — built as a full first-class Decision Tree
   branch (§3, §5) with explicit success criteria (accurate
   understanding + no pressure + standing low-commitment door left
   open, mapped to Step 1G End State 1, not End State 2) — not a
   fallback message.
6. Program/campaign not currently active — resolved with honest
   disclosure + closest alternative if one exists + reactivation
   notification if not (new config flag
   `program_reactivation_notification_enabled`, mirroring Commerce
   Ecom's back-in-stock pattern) — never implies a program exists
   without Business Memory confirmation — §5, §6.
7. Recurring donor status check — Core Agent Support Handler owns this
   at intake (shared Entry tree, first branch), same ownership pattern
   as Commerce/Appointment's returning-customer handoffs — §5 (shared
   tree), §8.
8. Gift/tribute donations — dual-identity structure adapted from
   Commerce's gift-purchase resolution: honoree NAME always required,
   honoree CONTACT optional and conditional (only if a notification is
   requested) — genuinely different data need from Commerce's gift
   case, not a copy-paste — §4, §5.
```

---

## STRESS-TEST CROSS-CHECK (Engagement)

Required before completion, per Step4_Engagement_Instructions.md. Every existing stress-test case that references Engagement (`Stress_Test_Library_v1.md` Sections 1, 2.5, 4, 5) is walked through against all three per-type Decision Trees and the shared Entry tree — not just whichever type the existing test cases happen to reference most.

```
U-01/U-02/U-03/U-04/U-05/U-07/U-08 (Section 1.1, Customer Behavior
  Matrix):
  Intent 01/02/03/04/05/07/08 routing — satisfied directly across all
  three types. Intent 04 (existing donor/volunteer record) is the
  first branch checked in the shared Entry tree (§5), routing to Core
  Agent before any type-specific logic runs.

MI-04 (Section 1.3 — "Do you offer scholarships and also how do I sign
  up to volunteer?", the exact scenario this task's instructions flag
  as a previously-unresolved Engagement gap):
  Satisfied explicitly and directly — this is Entry Scenario 13, with
  its own Decision Tree treatment (§2, §5 shared tree): the
  informational/donate-adjacent component is answered via Core Agent
  FAQ, and the Volunteer component proceeds through the Volunteer
  Decision Tree in the same turn, matching MI-04's own expected
  handling ("both components answered... only Volunteer proceeds
  toward an actual registration action this turn") exactly. This
  closes Stress Test Library Open Gap 2 for Engagement specifically —
  the general Step 1F multi-intent mechanism was always sufficient,
  this build simply gives it an explicit, named landing spot in the
  archetype's own Decision Tree rather than leaving it purely
  inferred.

Section 2.5 (Engagement Configuration Combination Table, Config A/B/C):
  Confirmed consistent — Config A's fallback message, Config B's
  "direct registration/guided-to-form per type, no proactive matching
  without Growth ON" boundary, and Config C's full-stack behavior
  (trust-building → matched registration → recovery cadence → welcome
  sequence emails) all match this build's Conversion Path (§6) and
  Decision Trees (§5) without contradiction.

DR-03 (pre-record opt-out, Module 4 §5):
  Directly relevant to the Passive Supporter path's Tier 2 email
  opt-in (§3, §4) — if a supporter later says "actually don't email
  me," the existing pre-record suppression mechanism (Module 4 §5,
  already resolved) applies unmodified; this build does not need a
  separate Engagement-specific opt-out rule.

RT-02 (manipulation attempt — "just decide for me"):
  Satisfied by reference — Step 2 §4's Freedom Boundary Enforcement
  Rules apply unmodified; nothing in this build grants the agent
  authority to unilaterally pick a contribution type or override the
  Freedom 4/10 band's proactive-recommendation limits.

RT-10 (sensitive/high-liability claims — e.g., tax-deductibility of a
  donation):
  Satisfied by reference — Step 2 §2.2 Risk-Based Freedom Reduction
  applies unmodified; a tax/legal claim about donation deductibility
  triggers the same temporary reduction to conservative, escalation-
  ready behavior as any other archetype's legal/financial/medical
  claim (§8's Confidence Gate escalation trigger covers the impact-
  claim case specifically; tax-deductibility claims fall under this
  same universal rule, not a new Engagement-specific carve-out).

RT-13 (concurrent sessions, differing intents):
  Satisfied by reference — Step 1A's Concurrent Session Deduplication
  Rule is universal; nothing in this build's Decision Trees changes
  how a second, differently-intended session is handled.

RT-14 / DV-01 / DV-03 / DV-04 (invalid or insisted-invalid data):
  Satisfied by reference — Data Collection Timing (§4) applies Step 0B
  §7's validation, correction-flow, and country-code rules unmodified
  to every Tier 2/3 field collected across all three types, including
  the honoree-name/honoree-contact fields introduced by this build.

DV-02 (relative-date resolution, e.g. "next Tuesday" for an Attend
  registration):
  Same pre-existing, already-documented open gap at the Step 0B layer,
  flagged (not fixed) during both the Commerce and Appointment builds
  — Attend's date collection (§4, §5) is exactly as exposed to this
  gap as any other archetype's. Not a new gap this build reveals;
  restated for completeness, left with Step 0B as its owner — same
  discipline as the prior two builds' DV-02 flags.
```

**Result:** No new, previously-undiscovered gap was found that this Engagement build fails to cover across any of the three conversion types. MI-04 — the one Engagement-specific gap explicitly flagged in the Stress Test Library — is now closed by this build's shared Entry tree. One pre-existing, cross-archetype gap (DV-02) is confirmed to also apply to Engagement's Attend type, flagged rather than fixed, consistent with the Commerce and Appointment precedent.

---

## STEP 4 ARCHETYPE 4 (ENGAGEMENT) COMPLETION SUMMARY

- **Structural difference from prior three builds (Emergency, Commerce, Appointment) — explicitly noted per this task's instructions:** Engagement has no single conversion type and no scoring gate, and the Execution Plan itself flagged it as "weakest in the original architecture, needs redesign." Every prior archetype build (including Commerce's two sub-variants) still resolved to one Journey Map / Decision Tree per meaningfully distinct path; this build required FOUR parallel, fully-specified paths (Donate, Volunteer, Attend, Passive Supporter) sharing only a common Entry/Trust-Building opening — and required one of those four paths (Passive Supporter) to be designed as a genuine success state rather than a fallback or an unconverted-opportunity case. This is more original design work than template application, consistent with the instructions' framing.
- **Sections completed:** 1. Customer Psychology Summary (shared) / 2. Common Entry Scenarios (15, deliberately distributed across all 3 types + passive) / 3. Full Conversation Journey Map (shared Entry/Trust-Building + 4 distinct sub-maps) / 4. Data Collection Timing (distinct Tier 2 content per type + passive-supporter capture + tribute dual-identity) / 5. Decision Tree (shared Entry/Capacity-Routing tree + 3 per-type trees) / 6. Conversion Path (Mode A/B/C shown per type, not shared generically) / 7. Recovery Trigger Moments (Module 4's existing definition used as-is + new passive-supporter ownership resolution) / 8. Escalation Boundaries.
- **Approach taken:** Single continuous pass, despite Constraint 1 explicitly inviting a split into sequential sub-passes (shared Entry, then Donate, then Volunteer, then Attend). Judgment call: unlike Commerce's two sub-variants (which are largely independent businesses that happen to share an archetype label), Engagement's four paths share a single Entry/Trust-Building opening and a single Capacity-Routing decision point that all four paths depend on — building them sequentially with stops in between would have risked the shared opening drifting out of sync with each path's specific requirements as they were built. A single pass kept the shared foundation and all four dependent paths consistent throughout, the same reasoning already used for Commerce's single-pass decision, applied here despite the larger structural surface.
- **Module Ownership Contract applied throughout:** Every Decision Tree branch and Journey Map step carries an explicit [Owner: ...] tag. Two ownership resolutions stand out beyond the standard pattern:
  - The recurring-donor handoff (§5 shared tree, first branch) follows the same Core-Agent-at-intake pattern as Commerce/Appointment's returning-customer resolutions.
  - The passive-supporter long-term ownership question (§7) — explicitly flagged by the instructions as "not obviously answered by either module's existing definition" — is resolved as belonging to NEITHER Growth Agent nor Recovery Engine in a continuous sense: Growth Agent has no defined background/dormant mode, and Recovery Engine's own trigger definition structurally excludes a customer who never matched a contribution type. Ownership is deliberately non-continuous — each live re-engagement is owned fresh by whichever module Step 1D routes it to; any accepted low-commitment opt-in is ordinary Email Manager outbound content, not a Growth or Recovery cadence.
- **All 8 flagged design questions resolved** — see the Design Decisions Summary block above for the full list with section references. Judgment-call decisions and their reasoning:
  - **Passive supporter success criteria** (Q5): resolved as mapping to Step 1G End State 1 (Successful Completion), not End State 2 (Open Opportunity) — this was a deliberate, non-obvious choice, since treating a non-converting passive supporter as an "opportunity" would reintroduce exactly the chasing dynamic Step 0A warns damages this archetype's relationships more than any other.
  - **Trust-building phase duration** (Q4): resolved as signal-based rather than turn-count-based, reusing Module 2's existing Ready-signal-skips-discovery pattern (EC-01) rather than inventing a new timing mechanism — consistent with Rule 4 (reference, don't redefine).
  - **Program/campaign not currently active** (Q6): resolved with a new config flag (`program_reactivation_notification_enabled`) deliberately modeled on Commerce Ecom's back-in-stock notification pattern — the underlying shape (honest gap disclosure → alternative if available → notify-me-later if not) is identical across archetypes even though the specific content differs, which is why this build adapted rather than reinvented it.
  - **Gift/tribute donations** (Q8): resolved with a structurally similar but substantively different dual-identity pattern than Commerce's gift-purchase resolution — the second identity's data requirement (name-only by default, contact only if explicitly requested) is genuinely different from Commerce's recipient-always-needs-an-address case, reflecting that a tribute donation's second party isn't necessarily receiving anything physical.
- **New Business Config fields (added to Appendix A):** `program_reactivation_notification_enabled` (boolean, default false — Attend's program-not-active handling, §5/§6).
- **Enterprise Expansion Flags** (per Architecture Expansion Rule — not yet in scope, noted for future expansion):
  - **Tribute/memorial donation record structure:** §4's honoree name/contact fields are not yet defined anywhere in the Integration Contract's Conversion Record schema — this build defines the conversational capture pattern, not the backend data model; flagged for Appendix A's Conversion Record Additions in a future revision.
  - **General outbound opt-in tracking:** §7's resolution of the passive-supporter question depends on a Business Memory/CRM-level "general updates opt-in" concept distinct from both Lead records and Recovery records — this concept is referenced as the landing place for that data but is not itself defined in the Integration Contract; this is a genuine gap this build surfaces rather than resolves, consistent with the instructions' explicit direction not to attempt resolving Module 4's WF-105 infrastructure question, extended here to this adjacent but distinct data-model question.
  - **Volunteer live-capacity data feed:** §5's Volunteer Confidence Gate assumes Business Memory CAN in principle contain live program-capacity data, but no integration pattern for keeping that data current is defined anywhere in this document — same category of gap as Appointment's practitioner-level calendar granularity flag from the prior build.
- **Open questions for architect review:**
  - The passive-supporter ownership resolution (§7) concludes that no module owns long-term nurture in a continuous sense — architect should confirm this is philosophically correct for the business model (i.e., that Zenny is not expected to run an ongoing newsletter/drip program as part of its core runtime), or whether a future Module 6 (Content/Newsletter Manager) should eventually own this space explicitly rather than leaving it as "general business-configured outbound."
  - MI-04's resolution (multi-type message handling) relies on Step 1F's general multi-intent mechanism working correctly for a Donate-adjacent-informational + Volunteer-registration combination specifically — this build asserts but does not newly test that Step 1F's Blocking/Supporting classification correctly identifies the Volunteer registration intent as the actionable component; architect should confirm this classification judgment during implementation testing.
  - The Donation Ask Calibration's concrete example language (§5, design question 3) is this build's own phrasing, not sourced from existing approved copy — architect/marketing should treat it as an illustrative pattern to adapt to brand voice, not verbatim required script.
- **Ready for architect review:** YES

---

### ARCHETYPE 5 — Consultation Engine (Agentic 8/10)

This section applies the Universal Runtime (Step 1), Freedom Boundary Spec (Step 2), and Service Modules (Step 3) to Consultation's specific customer reality — the highest-freedom, highest-complexity archetype in the system, closest to a human sales/advisory rep. This is the FINAL archetype build; after this section, all five archetypes (Emergency, Commerce, Appointment, Engagement, Consultation) have complete Step 4 Archetype Operating Systems. Built against the same hardened Batch 3 foundation as every prior Step 4 pass — the Module Responsibility Contract (Step 1D.0.5), the Universal Availability Validation Layer (Module 3 §2.1), Universal Mode Naming (Module 3 §2), Growth Agent (Module 2), and the Step 0B §7 Data Validation Layer are referenced throughout, not retrofitted.

Marketing Agency and Travel Agency are built as two fully independent sub-variants — closer to Commerce's pattern than Engagement's, since these two don't share an entry point the way Engagement's four paths did. Both use the identical 8/10 freedom band and identical Score Gate mechanics (Module 3), but what "good discovery" actually means is completely different (business diagnostic questions vs. destination/travel-preference questions) — both are built fully, neither is treated as a light variant of the other.

Per the instructions, this build's primary deliverable is a concrete, buildable answer to the discovery-depth-is-enough question — defined once below as a shared framework, then applied with sub-variant-specific concrete examples inside each sub-variant's own Decision Tree (§5). All 5 flagged design questions are resolved directly within the sections below, and restated as explicit decisions in this archetype's completion summary. Per the instructions, the scoring MECHANISM itself (how the 0-100 number is calculated) is not defined anywhere in this build — that boundary, already confirmed multiple times elsewhere in this document, is not revisited here.

---

## DISCOVERY-DEPTH-IS-ENOUGH — THE CORE DECISION RULE

This is the single most important unresolved question this build answers, per the instructions. The rule is built entirely from tools already in the document — the Discovery Budget Rule (Step 2 §2.3), the Confidence Gate (Step 1D.2), and an explicit SPIN-stage vocabulary that names, for the first time at this level of granularity, the discovery progression Growth Agent's Discovery Flow (Module 2 §A) already performs implicitly. Naming it here is a Step 4-level clarification, not a redefinition of Module 2 — the same relationship Universal Mode Naming (Batch 3) has to Module 3's existing Conversion Modes Table.

**The rule, stated concretely:**

```
Discovery is sufficient to proceed toward Score Gate evaluation when
BOTH of the following hold:

1. SPIN FLOOR: the agent has established, through actual follow-up
   questions (not assumption), at least the IMPLICATION stage for the
   customer's core stated need — not just Situation (surface facts:
   industry, team size, trip dates, party size) and not just Problem
   (a named pain point or goal: "not enough clients," "want a
   relaxing trip"), but a surfaced answer to "what does this actually
   cost you / what's at stake if this doesn't get solved." Need-payoff
   (the customer articulating the value of a solution) is NOT required
   as a floor — it frequently happens naturally inside the pitch/
   handoff itself, and requiring it beforehand would over-collect,
   directly violating the Discovery Budget Rule's "permission to ask
   is not a requirement to ask."

2. CONFIDENCE GATE: the agent's Confidence Gate (1D.2) reads HIGH —
   not Medium, Low, or Conflicting — specifically on whichever fields
   Business Memory/the scoring integration defines as required scoring
   inputs for this deployment (e.g., budget range, timeline, decision-
   making authority — the EXACT field set is business-configured, per
   the scoring mechanism's own out-of-scope boundary; this rule only
   requires that WHATEVER those fields are, the agent's confidence on
   them specifically is High before treating discovery as complete —
   not confidence on discovery topics broadly).

SHORTCUT (readiness-signal override, not a new mechanism): If at any
point the customer produces a clear Intent 03 signal, Step 1E's
existing priority system (Intent 03 always outranks Intent 02)
applies exactly as it does in every other archetype — discovery stops
immediately and the standard Intent-03-driven handoff to Conversion
Engine fires with whatever data currently exists, regardless of
whether the Implication floor or Confidence Gate condition above has
been met. This build does not invent a "discovery incomplete" flag or
a delayed-scoring behavior for this case: what happens when Score Gate
evaluation receives partial inputs is either the scoring mechanism's
own concern (out of scope) or already handled by Module 3's existing
full 0-100 tier routing (Nurture / Mode A / Mode C), which was always
built to handle whatever score comes back, regardless of how much
discovery preceded it.
```

**Module Ownership Contract resolution (the Growth-Agent-to-Conversion-Engine handoff timing question, required by the instructions):**

```
The question: is the handoff customer-signal-driven (Intent 03, same
as every archetype) or does Consultation need an additional signal
specific to "discovery is complete enough to score"?

RESOLUTION: The actual module-transition trigger remains customer-
signal-driven (Intent 03) — this build does NOT invent a second,
Consultation-specific handoff mechanism separate from Step 1E's single
priority system, since fragmenting that system per-archetype would
undermine the one thing every prior Step 4 build has kept consistent.

What Freedom 8/10 DOES add, more prominently than in lower-freedom
archetypes, is Growth Agent's own PROACTIVE authority to naturally
invite the customer toward that Intent-03-triggering moment once the
discovery-depth-is-enough rule above is satisfied — e.g., Step 0A's
own example: "based on what you've shared, this sounds like a fit —
I'll connect you with someone on our team" (cited, not invented). If
the customer accepts this invitation, THAT acceptance is itself the
Intent 03 signal that fires the standard handoff.

Net effect: the discovery-depth rule governs the TIMING of Growth
Agent's own proactive invitation (a Growth-Agent-side behavior
decision, fully in this build's scope) — it does not create a second
module-transition signal alongside Intent 03 (which remains the single
universal trigger, per the Module Responsibility Contract). This
keeps the ownership model identical to every other archetype while
still giving Consultation the concrete discovery-depth answer the
instructions require.
```

**Concrete floor examples (per sub-variant — worked in full inside each Decision Tree, §5):**
```
Marketing Agency:
  Situation:   "What does the business do, roughly how big is the
               team, what's the current client-acquisition approach?"
  Problem:     "What's not working — not enough leads coming in, or
               leads coming in but not converting?" (Step 2's own
               worked example, reused verbatim as this build's central
               case).
  Implication (FLOOR): "If that bottleneck doesn't get fixed in the
               next few months, what does that actually cost you —
               missed revenue, team capacity, competitive position?"
               This question is what turns a surface complaint into a
               diagnosed problem — it is the concrete difference
               between "enough" and "not enough" for this sub-variant.

Travel Agency:
  Situation:   "When are you thinking of traveling, roughly how many
               people, any specific occasion?"
  Problem:     "What's the main thing you want this trip to deliver —
               relaxation, adventure, a specific experience?"
  Implication (FLOOR): "Is this a milestone trip where getting it
               right really matters — honeymoon, anniversary — or is
               there more flexibility if plans shift?" This
               establishes stakes/consequence, not just preference,
               which is the same functional floor as Marketing
               Agency's cost-of-inaction question, adapted to a
               travel-specific stakes framing.
```

---

## CONSULTATION — MARKETING AGENCY

#### 1. Customer Psychology Summary

Reference: Step 0A Archetype 5 (Consultation) in full — the archetype with the most existing content already built (Step 0A plus Step 2's own worked examples); consolidated and extended here, not restated.

```
Mental state:      Evaluative, self-interested in outcome — closest to
                    a B2B/high-consideration buyer mindset. Expects to
                    be asked questions, unlike Commerce customers.
Trust level:       Low at start, must climb quickly through
                    DEMONSTRATED understanding — a shallow/generic
                    response reads as immediately disqualifying.
Buying readiness:  Three genuinely distinct entry temperatures — Cold
                    (Exploring), Warm (Considering), Hot (Deciding-
                    Ready) — each requiring different handling.
Patience Window:   LONG, but CONDITIONAL on perceived competence — not
                    unconditional like Engagement's. Discovery
                    tolerance: High.
Relationship/
Transaction:       30% Transaction / 70% Relationship — discovery
                    quality and demonstrated understanding drive
                    conversion more than any transactional push.
Win condition:     "They actually understood my specific situation, I
                    know what happens next, and I trust that when I
                    talk to a human they'll already know my context
                    instead of starting over."
```

**Runtime implications (what this psychology forces at the architecture level, extending Step 0A/Step 2 rather than restating them):**
```
- Freedom Level 8/10 (Step 2) is the direct architectural consequence
  of "patience conditional on perceived competence" — adaptive
  question sequencing and challenge authority (Step 2 §3 worked
  example: challenging "more clients" as vague) are not optional
  flourishes here, they are what the LONG Patience Window is actually
  paying for. A rigid, scripted discovery sequence at this archetype
  would violate Step 0A's own "what causes disengagement" (generic,
  non-adaptive questions).
- The "conditional, not unconditional" patience distinction from
  Engagement is the direct reason this build's challenge-boundary
  resolution (§5, design question 5) caps respectful pushback at once
  per topic — patience here is earned by competent questions, and a
  second push on an already-deflected point reads as interrogation,
  not diagnosis (Step 0A "what causes disengagement": "feeling like
  the conversation is a lead-gen form in disguise").
- Score-gated conversion (Module 3) combined with "customer should not
  be able to tell they're being scored" (this build's own framing,
  consistent with Step 0C §4 Privacy Boundaries never surfacing
  tracking-style detail to the customer) is the direct reason this
  build's 70-84 tier treatment (§6, design question 2) changes only
  internal/backend behavior, never customer-facing language that
  reveals scoring.
- The action-level pricing-authority boundary (Step 2's own worked
  example, cited exactly) is not a freedom-level restriction — even
  at 8/10, the ceiling is diagnostic and qualifying authority, not
  commercial commitment authority (Step 1D.1).
```

---

#### 2. Common Entry Scenarios

Minimum 10-15, covering all three entry temperatures established in Step 0A. [Owner tags per the Module Responsibility Contract, Step 1D.0.5.]

```
COLD (3):

1. "tell me about what you guys do"
   Signals: Cold/Exploring, no stated problem yet (Step 0A Common
   Conversation Pattern 1). → [Owner: Core Agent FAQ / Growth Agent] —
   value framing + one light qualifying question, not a pitch.

2. "do you work with small businesses or only enterprise clients"
   Signals: Cold, fit-testing before investing in a real conversation.
   → [Owner: Core Agent FAQ] — factual answer, light bridge toward
   what they're working on.

3. "what makes you different from other agencies"
   Signals: Cold, comparison-adjacent but not yet an Intent 08
   objection — a genuine exploratory question. → [Owner: Growth Agent]
   — specific, non-generic differentiation, never a competitor attack.

WARM (5):

4. "I need more clients for my business"
   Signals: Warm/Considering, vague goal stated (Step 0A Common
   Conversation Pattern 2, Step 2's own worked example). → [Owner:
   Growth Agent, Discovery Flow] — adaptive discovery toward
   specificity, see §5 Discovery-Depth-Is-Enough application.

5. "our leads aren't converting, not sure why"
   Signals: Warm, Problem-stage already stated by the customer
   unprompted — discovery starts closer to Implication than Situation
   here (§5 notes this shortcut explicitly).

6. "just tell me the price and I'll decide if I want to move forward"
   Signals: Pricing-before-discovery pressure, framed as decision-
   conditional (Step 2's own worked example). → [Owner: Growth Agent]
   — refuses to quote (action-level boundary), treated as an implicit
   readiness signal per this build's resolution (design question 4,
   §5).

7. "we just need more visibility, I guess"
   Signals: Vague, low-effort answer — tests the challenge boundary
   (design question 5, §5).

8. "can you guarantee a return on this investment"
   Signals: High-liability financial claim request (Stress Test
   RT-10). → [Owner: Growth Agent, Risk-Based Freedom Reduction, Step
   2 §2.2] — no outcome guarantees made, ever, regardless of freedom
   level.

HOT (2):

9. "I want to book a call with someone"
   Signals: Hot/Ready, Intent 03 directly (Step 0A Common Conversation
   Pattern 3). → [Owner: hands directly to Score Gate evaluation,
   discovery-depth rule shortcut applies per §5's override] — no
   forced full discovery.

10. "can you set up a call with your senior strategist this week"
    Signals: Hot, time-specific, possibly signals urgency worth
    factoring into escalation priority framing (§8) though not the
    score itself.

EXISTING CLIENT / MIXED / EDGE (4):

11. "can you check the status of our campaign"
    Signals: Existing client, Intent 04. → [Owner: Core Agent Support
    Handler, Module 1 B] — NOT a Consultation-archetype flow; same
    ownership pattern as every prior archetype build's returning-
    customer handoff.

12. "I want to book a call but I'm honestly not sure this isn't just
    another agency that overpromises"
    Signals: Booking intent (Intent 03) + Blocking trust objection
    (Intent 08), per Stress Test MI-03. → [Owner: Growth Agent,
    Objection Handling — Trust type] — trust objection resolved first,
    booking proceeds only after confidence restored (Blocking
    component takes priority, per Step 1F).

13. "we paid for a strategy call last month and no one followed up"
    Signals: Complaint, Intent 05, Universal Psychology Override. →
    [Owner: Core Agent Complaint Handler, Module 1 C] — Consultation
    flow stands down entirely until resolved.

14. "what's your typical price range, just curious"
    Signals: Pricing question framed as ordinary curiosity, NOT
    decision-conditional — distinguishing test from Entry Scenario 6
    (§5, design question 4). → [Owner: Growth Agent] — general-range
    answer if Business Memory allows one, no shortcut triggered,
    discovery continues normally.

15. "not interested right now, just looking"
    Signals: Explicit low-commitment signal, distinct from Engagement's
    passive-supporter case but functionally similar in spirit —
    however, Consultation has no equivalent first-class passive path
    (Module 3's Nurture tier already serves this function within the
    score-gate model, per §6 below) → [Owner: Growth Agent] — light,
    no-pressure close, Tier 2 capture offered if any value was
    exchanged, per Step 0B.
```

---

#### 3. Full Conversation Journey Map

**Happy path (Warm entry, discovery-depth reached naturally, all 3 score-tier outcomes shown):**
```
Customer message received
↓
1A Session State Check (New / Returning Lead / Existing Customer /
   Dormant Customer)
↓
1B Intent Classification
↓
Intent 04 (Existing Customer Support — campaign/project status)
   detected?
  YES → [Owner: Core Agent, Module 1 B] — full handoff, Consultation
        flow stands down for this conversation.
  NO  → continue
↓
Intent 05 (Complaint) detected?
  YES → [Owner: Core Agent Complaint Handler, Module 1 C]
  NO  → continue
↓
Entry temperature classified (Cold / Warm / Hot, Step 0A)
↓
[Owner: Growth Agent] Adaptive Discovery (Freedom 8/10) — SPIN
   progression: Situation → Problem → Implication, challenge-authority
   used at most once per topic (§5, design question 5)
↓
Discovery-Depth-Is-Enough check (evaluated after every exchange, per
   the shared framework above) — Implication floor reached AND
   Confidence Gate High on required scoring-input fields?
  NO  → continue discovery (unless an Intent 03 shortcut fires, per
        the override — jumps directly to the ACTION PERMISSION /
        SCORE GATE step below)
  YES → [Owner: Growth Agent] Proactive invitation offered: "based on
        what you've shared, this sounds like a fit — I'll connect you
        with someone on our team" (Step 0A's own example)
↓
Tier 2 trigger: summary offer, AFTER real discovery insight (§4)
↓
Customer accepts the invitation / confirms readiness → Intent
   reclassifies to 03 (Step 1E) → [Owner: hands to Conversion Engine]
↓
consultation_scoring_enabled config check (Module 3 §3)
  false → Mode B (Open Booking, no gate) — see §6
  true  → Score Gate evaluates (scoring mechanism itself out of
          scope) → tier result:
            < 50   → Nurture path (§6)
            50–84  → Mode A (Scored Booking, §6) — includes the 70-84
                      real-time sales-alert treatment (design question
                      2) for the upper portion of this band
            ≥ 85   → Mode C (Human Priority, §6)
↓
Step 1G Exit: End State 1 (Mode A confirmed), End State 2 (Mode B
   pending / Nurture, Recovery-eligible), or End State 5 (Mode C
   escalated)
```

**Branch paths (each detailed fully in §5 Decision Tree):**
```
- Existing-client support handoff branch (Intent 04)
- Trust objection blocking a Hot booking request branch (MI-03)
- Pricing-pressure-as-readiness-signal branch (design question 4)
- Vague-answer challenge-boundary branch (design question 5)
- Financial-guarantee-claim refusal branch (RT-10)
- Intent 03 shortcut bypassing incomplete discovery branch
- Conversion Engine OFF fallback branch
```

---

#### 4. Data Collection Timing

Applying Step 0B doctrine and the Step 0B §7 Data Validation Layer specifically to Marketing Agency Consultation — showing exactly what "real discovery insight" (Step 0B §4's Tier 2 trigger condition) looks like conversationally, per this build's requirement.

```
Tier applied: Tier 2 (Value Exchange Capture) primary, Tier 3
  (Commitment Capture) secondary — per Step 0B §4's Per-Archetype
  Collection Mapping Table: "Summary offer after discovery has
  produced real insight, not before."

What "real insight" concretely means here (not left abstract): the
  Tier 2 trigger does not fire at Situation-stage facts alone (industry,
  team size) — it fires once the Implication has been surfaced (§5
  Discovery-Depth-Is-Enough floor), because only at that point does a
  "summary" actually contain something worth sending. Offering a
  summary of surface facts back to the customer ("so you're in
  marketing, got it — want me to email you a recap?") is not a genuine
  value exchange and would violate Step 0B's own "never collect
  contact info to keep the lead before discovery has produced anything
  of value to summarize."

Exact timing:
  1. Tier 2 (summary offer): "I want to make sure I capture this
     correctly — want me to send a quick summary of what we've
     talked through so you have it, and so whoever you connect with
     next isn't starting from zero?" — triggered at the Implication
     floor, same moment the Discovery-Depth-Is-Enough rule is
     satisfied (§5), never before.
  2. Tier 3 (at actual booking, Module 3 §4): customer_name, contact
     method — collected as part of confirming the call, not
     re-requested if already captured at Tier 2.

Field validation applied per Step 0B §7: Name, Email/Phone validated
  per §7.1/§7.2/§7.3 as in every other archetype, including the
  graceful-persistence accept-with-flag fallback after one correction
  attempt.
```

**Backend submission gate:** Per Step 0B §7.4, no Consultation booking action fires until Tier 3 fields are VALID or INVALID-FLAGGED — consistent with every prior archetype build.

---

#### 5. Decision Tree

All conditions with explicit YES/NO branches. No dead ends. [Owner] tags applied per the Module Responsibility Contract (Step 1D.0.5). This is where the Discovery-Depth-Is-Enough framework (above) becomes a concrete, buildable branch for Marketing Agency specifically.

```
MESSAGE RECEIVED
↓
IS THIS INTENT 04 (EXISTING CLIENT — CAMPAIGN/PROJECT STATUS)?
  YES → [Owner: Core Agent Support Handler, Module 1 B] — full
        ownership transfer at intake, same pattern as every prior
        archetype build's returning-customer handoff.
  NO  → continue
        ↓
IS THIS A COMPLAINT / TRUST-BROKEN SIGNAL? (Intent 05)
  YES → [Owner: Core Agent Complaint Handler, Module 1 C]
  NO  → continue
        ↓
DOES THE MESSAGE ALSO CARRY A BLOCKING TRUST OBJECTION ALONGSIDE
BOOKING INTENT? (Stress Test MI-03 — "I want to book a call but I'm
honestly not sure...")
  YES → [Owner: Growth Agent, Objection Handling C — Trust type] —
        resolve the objection first (evidence-based response), booking
        proceeds only after confidence is restored — Blocking
        component per Step 1F, not processed in parallel.
  NO  → continue
        ↓
IS THIS A REQUEST FOR AN OUTCOME GUARANTEE OR HIGH-LIABILITY FINANCIAL
CLAIM? (Stress Test RT-10)
  YES → [Owner: Growth Agent, Step 2 §2.2 Risk-Based Freedom
        Reduction] — no guarantee made, ever; redirect to what IS
        confirmable (process, experience, comparable results if
        Business-Memory-backed) without promising an outcome.
  NO  → continue
        ↓
DOES THE CUSTOMER ALREADY GIVE AN EXPLICIT INTENT 03 SIGNAL? (Hot
entry, or a mid-discovery "let's book")
  YES → [Owner: hands directly to Conversion Engine Score Gate,
        SHORTCUT per the override rule above] — discovery stops
        immediately regardless of Implication floor / Confidence Gate
        status; whatever data currently exists is what Score Gate
        evaluates. No "incomplete discovery" flag invented (per the
        shared framework's own reasoning).
  NO  → continue
        ↓
IS THIS A PRICING QUESTION? (design question 4)
  Framed as decision-conditional ("tell me the price and I'll
  decide")? → [Owner: Growth Agent] Refuse to quote (Step 2's own
        worked example, cited exactly: "I don't have pricing
        authority to quote directly, that's something our team
        finalizes based on your specific situation. What I can do is
        make sure they have full context so that conversation is
        quick once you connect.") → per this build's resolution, this
        IS treated as an implicit readiness signal (the customer is
        functionally saying "I'm ready to decide, contingent on
        price") — routes toward the same SHORTCUT path above, offering
        expedited connection rather than continuing full discovery.
        This affects AGENT BEHAVIOR (whether discovery continues),
        never the score number itself, which remains entirely the
        scoring mechanism's own concern (out of scope).
  Framed as ordinary curiosity ("what's your typical range, just
  curious")? → [Owner: Growth Agent] General-range answer if Business
        Memory allows one, no commitment, no shortcut — discovery
        continues normally afterward.
  NO  → continue
        ↓
[Owner: Growth Agent] ADAPTIVE DISCOVERY CONTINUES — SPIN progression
per the shared framework:
  Situation established? → ask Situation-stage question if not yet.
  Problem established? → ask Problem-stage question if not yet.
  ↓
IS THE CUSTOMER'S ANSWER VAGUE OR UNDERSPECIFIED? (design question 5 —
Challenging the customer's stated position)
  YES → [Owner: Growth Agent] Respectfully challenge ONCE per topic —
        example: "more clients" → "what does 'more' mean for you right
        now — more leads, or more closed deals?" (Step 2's own worked
        example).
        Customer's follow-up answer STILL vague/deflecting on this
        SAME topic? → Do NOT challenge a second time on the identical
        point — accept the best available understanding (Confidence
        Gate Medium, not High, on this dimension) and move forward.
        A second push on an already-deflected point reads as
        interrogation, not diagnosis, per the Discovery Budget Rule's
        check #2 (has the customer received value recently, or only
        given) — repeated challenges without new value exchanged fail
        that check.
  NO  → continue
        ↓
DISCOVERY-DEPTH-IS-ENOUGH CHECK (the primary deliverable of this
build, applied concretely):
  Implication floor reached? ("If that bottleneck doesn't get fixed in
  the next few months, what does that actually cost you?" — answered,
  not just asked)
    NO  → continue adaptive discovery, re-evaluate this check after
          the next exchange.
    YES → continue to Confidence Gate check.
  Confidence Gate HIGH on required scoring-input fields (business-
  configured; e.g., budget range, timeline, decision authority)?
    NO (Medium/Low/Conflicting) → one more TARGETED question on the
          specific low-confidence field only — not a restart of
          discovery. Re-evaluate.
    YES → BOTH conditions met — discovery-depth-is-enough.
          [Owner: Growth Agent] Proactive invitation offered (Step 0A
          example, above) → customer acceptance = Intent 03 → hands
          to Conversion Engine Score Gate.
↓
CONVERSION ENGINE SCORE GATE (Module 3 §3, referenced not redefined)
↓
Step 1G Exit
```

---

#### 6. Conversion Path

Full flow per Module 3's existing Consultation Score Gate Logic (Nurture <50 / Mode A 50-84 / Mode C ≥85), applied at the archetype level with real conversational treatment for all three tiers — including the 70-84 sub-band, which per this build's instructions needs its own real-time treatment beyond what Module 4 already defines for the recovery-message context.

**Score < 50 — Nurture Path (what it actually feels like to the customer):**
```
Mechanics: per Module 3's existing rule, unchanged — no self-service
  booking offered, Tier 3 capture for follow-up only.
Conversational experience: "Based on what we've discussed, I want to
  make sure you get the right depth of attention — I'll have someone
  follow up with you directly rather than booking something that might
  not be the best fit yet." The customer never sees a number, never
  senses a rejection — the framing is care-based, not gatekeeping-
  based, consistent with Step 0A's "they actually understood my
  specific situation" win condition even at this tier.
Exit: Step 1G End State 2 (Open Opportunity) — Recovery Engine
  evaluates per §7.
```

**Score 50-69 — Mode A, Standard Scored Booking:**
```
Mechanics: per Module 3's existing rule, unchanged — standard booking
  flow, confirm date/time, collect Tier 3 fields, create calendar
  event, confirm explicitly.
Conversational experience: ordinary, warm booking confirmation — "You're
  booked for [date/time] — looking forward to it." No internal alert
  fires at this sub-band; this is Mode A's baseline experience.
Exit: Step 1G End State 1.
```

**Score 70-84 — Mode A, Real-Time High-Intent Treatment (design question 2, NEW — this build's primary contribution to Module 3's existing tier):**
```
Mechanics: IDENTICAL customer-facing booking mechanics to the 50-69
  case — Module 3's Mode A tier boundaries are not changed by this
  build (referencing, not redefining). The customer's actual booking
  experience is standard Mode A self-service.

What's NEW here — a real-time internal trigger this build adds,
  layered on top of Module 3/Module 4 the same way Commerce's cart-
  value threshold and Engagement's reactivation notification were
  layered on top of their respective modules: the moment a score
  resolves into the 70-84 band, an internal-only sales-team
  notification fires IMMEDIATELY (not waiting for a later Recovery
  Engine cadence step) — extending the alert Module 4 §4 already
  defines for the recovery-message context ("Score ≥70 leads also
  re-trigger a sales-team internal alert... on every recovery step")
  to the moment of INITIAL scoring as well, so a human knows about a
  high-value lead in real time, not only if the lead later needs
  recovering.

Optional, customer-facing addition (never reveals scoring): the
  booking confirmation MAY include a light, positive-framed note:
  "You're booked for [date/time] — I'll also flag this for one of our
  senior consultants so they come in with full context." This is an
  enhancement, never a lesser experience, and NEVER says "you scored
  high" or "you're a priority lead" — per this build's own standing
  rule that the customer should not be able to tell they're being
  scored (consistent with Step 0C §4 Privacy Boundaries).

Exit: Step 1G End State 1, identical to the 50-69 case.
```

**Score ≥ 85 — Mode C, Human Priority:**
```
Mechanics: per Module 3's existing rule, unchanged — Tier 3 capture,
  route to Human Handoff Handler at Priority 1 (Immediate) per Module
  1's Escalation Priority Classification (already defined, cross-
  referenced not re-decided — see §8).
Conversational experience: "This sounds like exactly the kind of
  situation our team should speak with you directly about — let me get
  you connected right away rather than booking a standard slot."
Exit: Step 1G End State 5.
```

**Mode B — Open Booking (`consultation_scoring_enabled` = false):**
```
Mechanics: per Module 3's existing rule, unchanged — proceeds directly
  to booking collection, no gate.
Applies uniformly regardless of discovery depth reached, since no
  score-tier distinction exists when scoring itself is off for this
  deployment.
```

---

#### 7. Recovery Trigger Moments

Exact triggers, per Module 4 applied specifically to Marketing Agency Consultation. Consultation already has the most sophisticated Recovery treatment of any archetype (score-aware messaging, Module 4 §4) — this section uses it, does not redefine it.

```
RECOVERY TRIGGER (exact moment, per Module 4 §2):
  Discovery complete, score returned, no booking made — including the
  <50 nurture path where no self-service booking was ever offered.

RECOVERY PROFILE: Consultation — 1 day → 3 days → 7 days → 14 days →
  30 days, 5 steps, per Module 4 §3 — the longest cadence of any
  archetype, reflecting the Long Patience Window and B2B/high-
  consideration decision timelines.

Score-aware messaging (Module 4 §4, used exactly as specified):
  Score ≥ 85:  Priority message — immediate urgency framing, senior
               consultant availability offered.
  Score 70-84: High Intent message — opportunity framing, discovery
               call offered; ALSO re-triggers the sales-team internal
               alert on every recovery step (Module 4 §4) — this is
               the SAME alert this build's §6 extends to fire at
               initial scoring too, not a second, different alert.
  Score 50-69: Qualified message — consultation-value framing.
  Score < 50:  Low Intent message — general nurture, resource-sharing,
               no call pushed.
Tone: Consultative and tier-appropriate, never salesy at Low Intent,
  never falsely urgent below 85 (Module 4 §4, applied as-is).
```

**Non-triggers (per Module 4 §2's universal list, applied without archetype-specific extension — nothing about Marketing Agency Consultation requires a new non-trigger case beyond what's already defined):**
```
- Customer declines outright — Step 1G End State 1, not an open
  opportunity.
- Mode C (Human Priority) outcomes — Step 1G End State 5, no recovery
  record while a human owns the conversation.
- Explicit cancellation — Module 3 CANCELLED state, respected as a
  deliberate decision.
```

---

#### 8. Escalation Boundaries

All triggers with exact agent behavior on detection, applying Module 1's existing Escalation Priority Classification (P1/P2/P3) — cross-referenced, not re-decided, per the instructions' explicit note that Score ≥85 is already Priority 1.

```
TRIGGER: Complaint / trust-broken signal (Intent 05)
  Behavior: Core Agent Complaint Handler (Module 1 C) takes the
  conversation first; Consultation flow stands down. Priority per
  Module 1 D's existing classification.

TRIGGER: Score ≥ 85 (Mode C, Human Priority)
  Behavior: Priority 1 (Immediate) — ALREADY defined by Module 3's
  Consultation Score Tier Routing ("route to Human Handoff Handler with
  Priority 1... a high-value qualified lead is time-sensitive
  commercially even though it is not a safety matter"). This build
  cross-references this existing definition rather than re-deciding it,
  per the instructions.

TRIGGER: Blocking trust objection alongside booking intent (MI-03)
  Behavior: Resolved within Growth Agent's Objection Handling (§5) —
  not an escalation trigger by itself; only escalates if the objection
  reveals a genuine complaint (Module 2 §C's existing re-classification
  rule).

TRIGGER: Outcome-guarantee or high-liability financial claim request
  (RT-10)
  Behavior: Step 2 §2.2 Risk-Based Freedom Reduction — no claim made;
  if pressed further after the redirect, escalates to Human Handoff
  Handler at Priority 3 (Review), same universal pattern as every
  other archetype's legal/financial/medical claim boundary.

TRIGGER: Confidence Gate (1D.2) Low/Conflicting on a factual claim
  about the agency's own track record/results
  Behavior: Per Step 0C ("never override business data with
  assumptions"), the agent does not fabricate specifics. Clarification
  attempt (max 2, Module 1 A) then Human Handoff Handler at Priority 3
  — a vague or fabricated competence claim would directly undermine
  this archetype's core trust mechanism (Step 0A: trust climbs through
  DEMONSTRATED understanding, not assertion).
```

---

**Marketing Agency — key design-question resolutions applied above (full cross-sub-variant summary follows this section):**
```
1. Discovery-depth-is-enough — concrete Implication-floor +
   Confidence-Gate-High rule, §5.
2. 70-84 real-time treatment — internal alert fires at initial scoring,
   optional non-revealing customer-facing note, §6.
4. Pricing pressure — decision-conditional framing treated as implicit
   readiness signal (behavior only, never the score itself), §5.
5. Challenge boundary — once per topic, never twice on the same
   deflected point, §5.
```

---

## CONSULTATION — TRAVEL AGENCY

#### 1. Customer Psychology Summary

Reference: Step 0A Archetype 5 (Consultation), Travel-specific subsections, in full — same shared psychology as Marketing Agency (Low-to-Medium trust climbing through demonstrated understanding, LONG-but-conditional Patience Window, 30/70 Transaction/Relationship), with the travel-specific fears and confidence drivers extended here.

```
Mental state:      Evaluative, same B2B-adjacent high-consideration
                    posture even though this is consumer-facing —
                    trip planning is a high-stakes, emotionally-
                    invested purchase, not a casual browse.
Trust level:       Low at start, climbs through TAILORED destination
                    reasoning specifically — a generic top-10 list
                    reads as immediately disqualifying, same
                    mechanism as Marketing Agency's "shallow response
                    disqualifies" but the specific failure mode here
                    is genericness, not surface-level questions.
Buying readiness:  Same three temperatures — Cold ("tell me about your
                    packages"), Warm ("what's the best destination
                    for X"), Hot ("I want to book a trip
                    consultation").
Patience Window:   LONG, conditional. Discovery tolerance: High.
Relationship/
Transaction:       30% Transaction / 70% Relationship.
Win condition:     Same structure as Marketing Agency, travel-specific
                    content: "They actually understood what I want
                    from this trip, I know what happens next, and I
                    trust the person I talk to will already know my
                    preferences instead of starting over."
```

**Runtime implications (extending Step 0A, not restating it):**
```
- The FEAR specific to Travel ("being pushed toward a destination/
  package that doesn't fit stated preferences just to close a
  booking") is the direct reason this build's destination-matching
  logic (§5, design question 3) treats an honest "I don't have
  confirmed detail on that" as categorically preferable to a
  generic-but-confident-sounding answer — the same honesty-over-
  forcing-a-fit principle already established in Commerce Restaurant's
  dietary resolution, Appointment's special-request resolution, and
  Growth Agent's No Suitable Recommendation Handling (Module 2 B.1),
  applied here to destinations instead of products/services.
- Because this sub-variant is consumer-facing rather than B2B, the
  Implication-floor SPIN question (§5, shared framework) is framed
  around occasion-stakes ("is this a milestone trip") rather than
  cost-of-inaction — both are functionally the same floor (surfacing
  what's actually at stake if the discovery/matching goes wrong), just
  expressed in the vocabulary that fits each sub-variant's actual
  customer conversation, not a business-diagnostic phrasing forced
  onto a consumer context.
- Group/complex trip requests (e.g., large destination weddings) carry
  the same higher-stakes-wins-ties directional bias already
  established elsewhere in this document (Restaurant's party-size
  threshold, Commerce's cart-value threshold) — see §5/§6 for how this
  build applies that bias to Travel specifically.
```

---

#### 2. Common Entry Scenarios

Minimum 10-15, covering all three entry temperatures. [Owner tags per the Module Responsibility Contract, Step 1D.0.5.]

```
COLD (2):

1. "tell me about your travel packages"
   Signals: Cold/Exploring, no stated trip goal yet. → [Owner: Core
   Agent FAQ / Growth Agent] — value framing + light qualifying
   question.

2. "do you only do luxury trips or budget options too"
   Signals: Cold, fit-testing. → [Owner: Core Agent FAQ] — factual
   range answer, bridge toward what they're actually planning.

WARM (6):

3. "what's the best destination for a honeymoon in December"
   Signals: Warm/Considering, Step 0A Common Conversation Pattern 4 —
   needs adaptive matching (budget, climate, style), not a generic
   list. → [Owner: Growth Agent, Discovery Flow]

4. "we want to visit [an obscure region with thin KB coverage]"
   Signals: Destination not well-covered in Business Memory. → [Owner:
   Growth Agent] — see Decision Tree §5 (resolves design question 3).

5. "just tell me the price and I'll decide"
   Signals: Pricing-before-discovery pressure, same pattern as
   Marketing Agency Entry Scenario 6. → [Owner: Growth Agent] — refuse
   to quote, treated as implicit readiness signal (design question 4,
   same resolution as Marketing Agency, applied here).

6. "we just want a nice trip somewhere warm, not picky"
   Signals: Vague, low-effort answer — tests the challenge boundary
   (design question 5).

7. "is this actually a real travel agency or some kind of scam"
   Signals: Legitimacy-testing, low trust. → [Owner: Core Agent FAQ] —
   transparency-first factual response.

8. "we're planning a 20-person destination wedding, where should we
   even start"
   Signals: Large, complex group trip — higher stakes, likely routes
   toward human involvement regardless of score (§5/§6, higher-stakes-
   wins-ties bias).

HOT (2):

9. "I want to book a trip consultation call"
   Signals: Hot/Ready, Intent 03 directly. → [Owner: hands directly to
   Score Gate evaluation, discovery-depth shortcut applies]

10. "can someone call me today about a trip we're planning"
    Signals: Hot, time-specific.

EXISTING CLIENT / MIXED / EDGE (3):

11. "can you check on our booking status"
    Signals: Existing client, Intent 04. → [Owner: Core Agent Support
    Handler, Module 1 B] — NOT a Consultation-archetype flow.

12. "our last trip had issues and no one helped us sort it out"
    Signals: Complaint, Intent 05, Universal Psychology Override. →
    [Owner: Core Agent Complaint Handler, Module 1 C]

13. "can you guarantee the weather will be good that week"
    Signals: An outcome-guarantee request in a domain (weather) the
    agent obviously cannot control — a lighter-stakes cousin of
    Marketing Agency's RT-10 financial-guarantee case, but the same
    underlying rule applies. → [Owner: Growth Agent] — no guarantee
    made, honest limitation stated plainly.
```

---

#### 3. Full Conversation Journey Map

**Happy path (Warm entry, discovery-depth reached naturally, all 3 score-tier outcomes shown):**
```
Customer message received
↓
1A Session State Check
↓
1B Intent Classification
↓
Intent 04 (Existing Customer Support — booking status) detected?
  YES → [Owner: Core Agent, Module 1 B] — full handoff.
  NO  → continue
↓
Intent 05 (Complaint) detected?
  YES → [Owner: Core Agent Complaint Handler, Module 1 C]
  NO  → continue
↓
Entry temperature classified (Cold / Warm / Hot, Step 0A)
↓
[Owner: Growth Agent] Adaptive Discovery (Freedom 8/10) — SPIN
   progression: Situation → Problem → Implication (occasion-stakes
   framing), challenge-authority at most once per topic
↓
Destination named — confirmed in Business Memory? (design question 3)
  NO  → Honest-Limitation branch (§5) — never fabricates specifics.
  YES → continue with tailored, KB-backed matching.
↓
Discovery-Depth-Is-Enough check (shared framework) — Implication floor
   reached AND Confidence Gate High on required scoring-input fields?
  NO  → continue discovery (unless Intent 03 shortcut fires)
  YES → [Owner: Growth Agent] Proactive invitation offered
↓
Tier 2 trigger: summary offer, AFTER real discovery insight (§4)
↓
Customer confirms readiness → Intent 03 → [Owner: hands to Conversion
   Engine]
↓
consultation_scoring_enabled config check
  false → Mode B (Open Booking) — see §6
  true  → Score Gate evaluates → tier result:
            < 50   → Nurture path (§6)
            50–84  → Mode A (Scored Booking, §6) — includes 70-84
                      real-time treatment
            ≥ 85   → Mode C (Human Priority, §6)
↓
Step 1G Exit: End State 1, End State 2, or End State 5
```

**Branch paths (each detailed fully in §5 Decision Tree):**
```
- Existing-client support handoff branch (Intent 04)
- Destination-not-in-KB honest-limitation branch (design question 3)
- Pricing-pressure-as-readiness-signal branch (design question 4)
- Vague-answer challenge-boundary branch (design question 5)
- Large/complex group trip higher-stakes branch
- Weather/outcome-guarantee refusal branch
- Intent 03 shortcut bypassing incomplete discovery branch
- Conversion Engine OFF fallback branch
```

---

#### 4. Data Collection Timing

Applying Step 0B doctrine and the Step 0B §7 Data Validation Layer specifically to Travel Agency Consultation.

```
Tier applied: Tier 2 primary, Tier 3 secondary — same structure as
  Marketing Agency, per Step 0B §4's Per-Archetype Collection Mapping
  Table (Consultation's mapping is shared across sub-variants; the
  CONTENT of what counts as "real insight" is what differs).

What "real insight" concretely means here: the Tier 2 trigger fires
  once occasion-stakes (the Implication floor) have been surfaced —
  "so this is a milestone trip where getting the details right really
  matters" — not at bare Situation facts (travel dates, party size)
  alone. A summary offered after only Situation-stage facts ("so
  you're traveling in December with 2 people, want me to email that?")
  is not yet a genuine value exchange.

Exact timing:
  1. Tier 2 (summary offer): "Want me to send you a quick summary of
     what we've talked through, so whoever you connect with next
     already has the full picture instead of starting over?" —
     triggered at the Implication floor.
  2. Tier 3 (at actual booking, Module 3 §4): customer_name, contact
     method — collected as part of confirming the consultation call.

Field validation applied per Step 0B §7: same as Marketing Agency —
  Name, Email/Phone per §7.1/§7.2/§7.3, graceful-persistence fallback.
```

**Backend submission gate:** Per Step 0B §7.4, unchanged from Marketing Agency's application.

---

#### 5. Decision Tree

All conditions with explicit YES/NO branches. No dead ends. [Owner] tags applied per the Module Responsibility Contract (Step 1D.0.5).

```
MESSAGE RECEIVED
↓
IS THIS INTENT 04 (EXISTING CLIENT — BOOKING STATUS)?
  YES → [Owner: Core Agent Support Handler, Module 1 B] — full
        ownership transfer at intake.
  NO  → continue
        ↓
IS THIS A COMPLAINT / TRUST-BROKEN SIGNAL? (Intent 05)
  YES → [Owner: Core Agent Complaint Handler, Module 1 C]
  NO  → continue
        ↓
DOES THE CUSTOMER ALREADY GIVE AN EXPLICIT INTENT 03 SIGNAL?
  YES → [Owner: hands directly to Conversion Engine Score Gate,
        SHORTCUT] — same override rule as Marketing Agency, applied
        identically (this is a shared framework, not sub-variant-
        specific).
  NO  → continue
        ↓
IS A SPECIFIC DESTINATION NAMED? (design question 3 — Travel Agency
destination-matching logic)
  YES → Is it confirmed in Business Memory/KB with genuine detail
        (not just a bare name on a list)?
          YES → [Owner: Growth Agent] Tailored, specific matching —
                reasoning tied to what the customer actually said they
                want (Step 0A "what creates confidence"), never a
                generic top-10 response.
          NO  → [Owner: Growth Agent] HONEST-LIMITATION BRANCH,
                directly parallel to Growth Agent's No Suitable
                Recommendation Handling (Module 2 B.1): "I don't have
                detailed, confirmed information on [destination]
                specifically — I don't want to give you generic advice
                that might not actually be accurate for that area."
                Then, depending on what's available:
                  Closest genuinely comparable destination in KB
                  exists? → Offer it, gap disclosed, never presented
                  as the same thing.
                  No comparable option? → Offer to connect with a
                  specialist who has firsthand knowledge: "What I can
                  do is connect you with one of our travel specialists
                  who knows that region directly." → Mode C, Priority
                  3 (Review) — see §8.
                Never invents specifics (climate claims, pricing,
                logistics) about an under-covered destination just to
                sound complete (Step 0C Level 3).
  NO  → continue (no destination named yet — ordinary discovery)
        ↓
IS THIS A LARGE OR COMPLEX GROUP TRIP? (e.g., 20-person destination
wedding)
  YES → [Owner: Growth Agent] Acknowledge specifically, continue
        discovery toward Implication as normal, but flag internally
        that this likely routes toward Mode C (Human Priority-
        adjacent) regardless of numeric score, per the higher-stakes-
        wins-ties directional bias already established for Restaurant/
        Commerce group-size thresholds — a 20-person wedding booking
        error is high-consequence in a way a standard 2-person
        booking isn't, independent of whatever the scoring mechanism
        would otherwise compute. This is an archetype-level judgment
        layered on top of Module 3's score tiers, same pattern as
        Commerce's cart-value threshold — Module 3's own Score Tier
        Routing text is not altered.
  NO  → continue
        ↓
IS THIS AN OUTCOME-GUARANTEE REQUEST OUTSIDE THE BUSINESS'S CONTROL?
(e.g., "can you guarantee good weather")
  YES → [Owner: Growth Agent] No guarantee made, honest limitation
        stated plainly, redirect to what IS controllable/confirmable
        (seasonal patterns if Business-Memory-backed, flexible
        rebooking policies, etc.).
  NO  → continue
        ↓
IS THIS A PRICING QUESTION? (design question 4)
  Same resolution as Marketing Agency — decision-conditional framing
  treated as implicit readiness signal (shortcut path), ordinary
  curiosity framing gets a general-range answer with no shortcut.
  NO  → continue
        ↓
[Owner: Growth Agent] ADAPTIVE DISCOVERY CONTINUES — SPIN progression,
same structure and same once-per-topic challenge cap as Marketing
Agency (design question 5) — e.g., "we just want a nice trip somewhere
warm, not picky" → "warm and relaxing, or warm with more activity/
adventure built in?" (one challenge); if still vague after the
follow-up, accept and proceed at Medium confidence on that dimension.
        ↓
DISCOVERY-DEPTH-IS-ENOUGH CHECK (shared framework, Travel Agency
concrete example):
  Implication floor reached? ("Is this a milestone trip where getting
  it right really matters, or is there flexibility?" — answered)
    NO  → continue adaptive discovery.
    YES → continue to Confidence Gate check.
  Confidence Gate HIGH on required scoring-input fields (business-
  configured — e.g., travel dates, budget range, party size, decision
  authority)?
    NO  → one more targeted question on the specific low-confidence
          field only.
    YES → discovery-depth-is-enough. [Owner: Growth Agent] Proactive
          invitation offered → acceptance = Intent 03 → hands to
          Conversion Engine Score Gate.
↓
CONVERSION ENGINE SCORE GATE (Module 3 §3, referenced not redefined)
↓
Step 1G Exit
```

---

#### 6. Conversion Path

Full flow per Module 3's existing Consultation Score Gate Logic, applied at the archetype level. The tier mechanics are IDENTICAL in structure to Marketing Agency (Module 3 does not define separate tier boundaries per sub-variant) — this section shows the Travel-specific conversational content, not a re-derivation of the tier logic itself.

```
Score < 50 — Nurture: same mechanics as Marketing Agency. Agent:
  "Based on what we've talked through, I want to make sure this gets
  the right attention — I'll have one of our travel specialists follow
  up directly rather than booking something that might not be exactly
  right yet." Exit: Step 1G End State 2.

Score 50-69 — Mode A, standard: "You're booked for a call on [date/
  time] to go over the details." Exit: Step 1G End State 1.

Score 70-84 — Mode A, real-time high-intent treatment (design
  question 2, same resolution as Marketing Agency): identical booking
  mechanics to 50-69; internal sales-team alert fires at initial
  scoring (same mechanism, extended from Module 4 §4's existing
  recovery-context alert); optional non-revealing customer-facing
  note: "I'll flag this for one of our senior travel specialists so
  they come in ready with a few tailored options." Never reveals
  scoring. Exit: Step 1G End State 1.

Score ≥ 85 — Mode C, Human Priority: "This sounds like exactly the
  kind of trip our team should talk through with you directly — let me
  get you connected right away." Priority 1 per Module 1 D (already
  defined by Module 3, cross-referenced not re-decided — see §8).
  Exit: Step 1G End State 5.

Mode B — Open Booking (`consultation_scoring_enabled` = false): per
  Module 3's existing rule, unchanged.
```

**Large/complex group trip routing (higher-stakes-wins-ties, per §5):** Regardless of the numeric score returned, a confirmed large/complex group trip (e.g., the 20-person destination wedding case) routes toward Mode C-adjacent human involvement — this is an archetype-level layer on top of Module 3's score tiers, not a change to Module 3's own tier boundaries. If the score independently already resolves ≥85, this is redundant with existing behavior; if the score resolves lower (e.g., a well-qualified 60), this build's own judgment overrides toward human involvement anyway, consistent with the same directional bias already applied to Restaurant's party-size-10 threshold and Commerce's cart-value threshold.

---

#### 7. Recovery Trigger Moments

Exact triggers, per Module 4 applied specifically to Travel Agency Consultation — identical mechanics to Marketing Agency (Module 4 does not define separate Consultation sub-variant cadences), shown here for completeness per this build's requirement that each sub-variant be fully specified.

```
RECOVERY TRIGGER: Discovery complete, score returned, no booking made
  — identical trigger definition to Marketing Agency (Module 4 §2).

RECOVERY PROFILE: Consultation — 1 day → 3 days → 7 days → 14 days →
  30 days, 5 steps, per Module 4 §3 — same cadence, same score-aware
  messaging table (Module 4 §4), used exactly as specified.

Travel-specific note: message content at each tier references what
  was actually discussed (destination, occasion) per Module 4 §4's
  existing "what the agent references from the prior conversation"
  rule — never generic ("following up on your inquiry") when specific
  context exists to reference.
```

**Non-triggers:** Same as Marketing Agency, per Module 4 §2's universal list — no Travel-specific extension needed.

---

#### 8. Escalation Boundaries

All triggers with exact agent behavior on detection, applying Module 1's existing Escalation Priority Classification (P1/P2/P3).

```
TRIGGER: Complaint / trust-broken signal (Intent 05)
  Behavior: Core Agent Complaint Handler (Module 1 C) takes the
  conversation first. Priority per Module 1 D's existing
  classification.

TRIGGER: Score ≥ 85 (Mode C, Human Priority)
  Behavior: Priority 1 (Immediate) — already defined by Module 3,
  cross-referenced, not re-decided, same as Marketing Agency.

TRIGGER: Destination not confirmable in Business Memory, no comparable
  alternative (design question 3)
  Behavior: Mode C, Priority 3 (Review) — an informational/matching
  gap, not urgent.

TRIGGER: Large/complex group trip (§5, §6)
  Behavior: Routes toward human involvement per the higher-stakes-
  wins-ties layer (§6) — Priority 2 (Standard) unless the travel date
  is imminent, in which case Priority 1 per Module 1 D's own examples
  ("urgent operational failure... time-sensitive").

TRIGGER: Outcome-guarantee request outside the business's control
  (weather, etc.)
  Behavior: No guarantee made; escalates to Human Handoff Handler at
  Priority 3 (Review) only if the customer presses further after the
  honest-limitation response — same universal pattern as Marketing
  Agency's RT-10 handling.

TRIGGER: Confidence Gate (1D.2) Low/Conflicting on a factual claim
  about a destination or the agency's own track record
  Behavior: Per Step 0C, the agent does not fabricate. Clarification
  attempt (max 2, Module 1 A) then Human Handoff Handler at Priority
  3.
```

---

**Travel Agency — key design-question resolutions applied above:**
```
1. Discovery-depth-is-enough — same Implication-floor + Confidence-
   Gate-High rule as Marketing Agency, occasion-stakes framing, §5.
2. 70-84 real-time treatment — same resolution as Marketing Agency,
   travel-specific example language, §6.
3. Destination-matching logic — honest-limitation branch, directly
   parallel to Growth Agent's No Suitable Recommendation Handling
   (Module 2 B.1), §5.
4. Pricing pressure — same resolution as Marketing Agency, §5.
5. Challenge boundary — same resolution as Marketing Agency, §5.
```

---

## STRESS-TEST CROSS-CHECK (Consultation)

Required before completion, per Step4_Consultation_Instructions.md. Every existing stress-test case that references Consultation (`Stress_Test_Library_v1.md` Sections 1, 2.4, 3–5) is walked through against both sub-variants' Decision Trees, covering all three score tiers.

```
IS-02 (Consultation Discovery Flow, Priority 5, mid-question, customer
  says "actually can you check on my last invoice"):
  Satisfied directly — this is the first branch checked in both
  Decision Trees (§5): Intent 04 (existing client) routes to Core
  Agent Support Handler before any Consultation-specific logic runs,
  with the discovery question preserved in Session Memory per Step
  1E's context-preservation rule, matching IS-02's expected handling
  exactly.

MI-03 (Consultation — "I want to book a call but I'm honestly not
  sure this isn't just another agency that overpromises"):
  Satisfied explicitly — this is Marketing Agency Entry Scenario 12
  with its own named Decision Tree branch, resolving the Blocking
  trust objection before booking proceeds, matching MI-03's expected
  handling exactly.

Section 2.4 (Consultation Configuration Combination Table, Config
  A/B/C):
  Confirmed consistent across both sub-variants — Config A's fallback
  message, Config B's manual-handoff framing ("Based on what you've
  shared, I'd like to get you connected — let me have someone reach
  out," used when Conversion Engine's score-gate mechanics aren't
  active), and Config C's full-stack behavior (adaptive discovery →
  score-gated booking → tiered recovery cadence → email summaries,
  with "I don't have pricing authority to quote directly" holding even
  at Full Stack) all match this build's Conversion Path (§6) and
  Decision Trees (§5) without contradiction, for both Marketing Agency
  and Travel Agency.

RT-02 (manipulation attempt — "just decide for me"):
  Satisfied by reference — Step 2 §4's Freedom Boundary Enforcement
  Rules apply unmodified; nothing in this build grants the agent
  authority beyond the 8/10 band's actual limits (diagnostic/
  qualifying authority, not commercial commitment authority) no matter
  how the request is phrased.

RT-10 (sensitive/high-liability claims):
  Satisfied explicitly in both sub-variants — Marketing Agency's
  "can you guarantee a return on this investment" (Entry Scenario 8)
  and Travel Agency's weather-guarantee case (Entry Scenario 13) are
  both named Decision Tree branches (§5) applying Step 2 §2.2's
  Risk-Based Freedom Reduction identically to how every other
  archetype's build has applied it.

RT-13 (concurrent sessions, differing intents):
  Satisfied by reference — Step 1A's Concurrent Session Deduplication
  Rule is universal; nothing in either Consultation Decision Tree
  changes how a second, differently-intended session is handled.

RT-14 / DV-01 / DV-03 / DV-04 (invalid or insisted-invalid data):
  Satisfied by reference — Data Collection Timing (§4, both sub-
  variants) applies Step 0B §7's validation, correction-flow, and
  country-code rules unmodified to every Tier 2/3 field collected.

DV-02 (relative-date resolution, e.g. "December" or "next month" for a
  Travel Agency booking):
  Same pre-existing, already-documented open gap at the Step 0B layer,
  flagged (not fixed) during the Commerce, Appointment, and Engagement
  builds — Travel Agency's date collection (§4, §5) is exactly as
  exposed to this gap as any other archetype's. Not a new gap this
  build reveals; restated for completeness, left with Step 0B as its
  owner — same discipline as every prior build's DV-02 flag.

ALL THREE SCORE TIERS — explicit confirmation this build covers each
  one as a genuinely distinct conversational experience, per the
  instructions' specific requirement:
  <50 Nurture: §6, both sub-variants — care-based framing, no
    self-service booking, never reveals the score.
  50-84 Mode A (including the 70-84 real-time treatment, this build's
    new contribution): §6, both sub-variants — identical booking
    mechanics across the full band; internal alert added at 70-84,
    never customer-visible.
  ≥85 Mode C: §6, both sub-variants — Priority 1 human handoff,
    cross-referencing Module 3's existing definition rather than
    re-deciding it.
```

**Scoring-mechanism boundary, reconfirmed:** No stress test case in this cross-check, and no design-question resolution in this build, defines or depends on how the underlying 0-100 score is calculated — every resolution above operates on "whatever score comes back" or "whatever fields the scoring integration requires," consistent with the out-of-scope boundary already confirmed multiple times elsewhere in this document (Module 3 §3's own precondition; Module 3's completion summary Q1).

**Result:** No new, previously-undiscovered gap was found that this Consultation build fails to cover, across either sub-variant or any of the three score tiers. One pre-existing, cross-archetype gap (DV-02) is confirmed to also apply to Travel Agency's date collection, flagged rather than fixed, consistent with every prior build's precedent.

---

## STEP 4 ARCHETYPE 5 (CONSULTATION) COMPLETION SUMMARY

- **This is the FINAL archetype build.** All five archetypes — Emergency, Commerce (Ecommerce + Restaurant), Appointment, Engagement (Donate/Volunteer/Attend/Passive Supporter), and Consultation (Marketing Agency + Travel Agency) — now have complete Step 4 Archetype Operating Systems. The runtime document's archetype layer is structurally complete.
- **Sub-variants completed:** Marketing Agency and Travel Agency, each complete to the 8-part structure, built as two genuinely independent sub-variants (closer to Commerce's pattern than Engagement's) sharing only the Discovery-Depth-Is-Enough framework and the Module 3 score-gate mechanics — neither treated as a light variant of the other.
- **Primary deliverable — Discovery-Depth-Is-Enough decision rule:** Built as a concrete, two-part test (Implication-stage SPIN floor + Confidence Gate High on business-configured required scoring-input fields), with a readiness-signal override reusing Step 1E's existing Intent-03-outranks-Intent-02 priority system rather than inventing a new handoff mechanism. Worked with real, concrete example questions for both sub-variants (Marketing Agency's cost-of-inaction framing, Travel Agency's occasion-stakes framing). This directly answers the instructions' core design problem — not a restatement of "use judgment," but a buildable test referencing only tools already in the document (Discovery Budget Rule, Confidence Gate, Step 1E priority system), plus one new naming contribution (explicit SPIN-stage vocabulary) that names what Growth Agent's Discovery Flow already does implicitly, the same relationship Universal Mode Naming has to Module 3's Conversion Modes Table.
- **Approach taken:** Single continuous pass covering both sub-variants (Constraint 1) — consistent with Commerce's precedent (two genuinely independent sub-variants sharing only an archetype label and, here, the Discovery-Depth-Is-Enough framework), rather than Engagement's shared-entry-then-branch pattern, since Marketing Agency and Travel Agency don't share a conversational entry point.
- **Module Ownership Contract applied throughout, including the Growth-Agent-to-Conversion-Engine handoff timing question:** Resolved as remaining customer-signal-driven (Intent 03), identical to every other archetype — Freedom 8/10 adds Growth Agent's own proactive-invitation authority once discovery-depth-is-enough is met, but this governs the TIMING of that invitation, not a second module-transition signal. This keeps Step 1E as the single universal handoff mechanism across all five archetypes now built.
- **All 5 flagged design questions resolved** — see each sub-variant's own resolution summary for section references. Judgment-call decisions and their reasoning:
  - **70-84 real-time treatment** (Q2): resolved by extending Module 4 §4's already-referenced sales-team alert (WF-302) to fire at initial scoring, not only at later recovery steps — genuinely new real-time behavior this build adds, while keeping Module 3's customer-facing Mode A booking mechanics completely unchanged across the full 50-84 band, preserving "customer should not be able to tell they're being scored."
  - **Pricing pressure and score independence** (Q4): resolved with a precise distinction the instructions asked for — decision-conditional pricing pressure affects AGENT BEHAVIOR (treated as an implicit readiness signal, shortcutting discovery) but never the score number itself, which remains entirely the out-of-scope scoring mechanism's concern. This distinction was reasoned directly from Step 2's own worked example, which already implicitly treats a persistent pricing push as readiness-adjacent ("make sure they have full context so that conversation is quick once you connect").
  - **Challenge boundary** (Q5): resolved as once per topic, never a second push on an already-deflected point — reasoned from the Discovery Budget Rule's check #2 (value exchanged vs. only given), not an arbitrarily chosen number.
- **New Business Config field (added to Appendix A):** `realtime_high_intent_alert_enabled` (boolean, default TRUE — unlike Commerce's/Engagement's opt-in customer-facing notification flags, this defaults true because it extends an already-existing internal-only sales alert (WF-302) to fire at initial scoring rather than introducing a new customer-facing capability requiring deliberate enabling).
- **Enterprise Expansion Flags** (per Architecture Expansion Rule — not yet in scope, noted for future expansion):
  - **Group/complex-trip escalation threshold:** Travel Agency's large/complex-trip routing (§5, §6) is deliberately left as a qualitative judgment ("large or complex"), not a specific numeric threshold like Commerce's `cart_value_escalation_threshold` or Restaurant's fixed ≥10 party size — flagged for architect review below rather than inventing a number without basis.
  - **Required scoring-input field registry:** The Discovery-Depth-Is-Enough rule's Confidence Gate condition depends on "business-configured required scoring-input fields" — this build assumes such a registry exists or will exist in Business Memory/the scoring integration, but does not itself define its schema (consistent with the scoring-mechanism-out-of-scope boundary); flagged as a genuine downstream dependency for whoever eventually specifies the scoring mechanism.
- **Open questions for architect review:**
  - Should Travel Agency's large/complex-trip routing get a specific numeric threshold (e.g., party size ≥ N) similar to Commerce's cart-value threshold, or is the qualitative judgment sufficient? This build deliberately did not invent a number.
  - `realtime_high_intent_alert_enabled`'s default-TRUE choice assumes businesses generally want this extension once WF-302 exists — architect should confirm this is the right default, or whether it should default false pending explicit opt-in like this build's Commerce/Engagement predecessors.
  - The SPIN-stage vocabulary this build introduces (Situation/Problem/Implication/Need-payoff) is new terminology at the Step 4 level, not previously named in Module 2's Discovery Flow text — architect should confirm this naming is acceptable as a Step 4-level clarification (per the Universal-Mode-Naming precedent cited above) rather than requiring a retrofit into Module 2 itself for full consistency.
- **Ready for architect review:** YES

---

## STEP 6 — Flowcharts

Visual maps converting the runtime logic in Steps 0–4 into Mermaid diagrams for builder handoff. Created in `02_Agent_Runtime_System/Flowcharts/`, one `.md` file per flowchart, each with a fenced ` ```mermaid ` block.

**Flowcharts created:**
```
1.  Universal_Runtime_Flow.md    — full message routing (1.0, 1.0.1, 1A–1G, 1.H)
2.  Service_Routing_Map.md       — module activation per config, action-permission gated
3.  Data_Collection_Map.md       — Tier system + validation gate, per-archetype mapping
4.  Core_Agent_Flow.md           — all 5 Core Agent sub-flows (A–E, B.1)
5.  Growth_Agent_Flow.md        — all sub-flows incl. Internal Conversation Recovery
6.  Conversion_Engine_Flow.md    — state machine + all modes per archetype
7.  Recovery_Engine_Flow.md      — trigger → cadence → suppression → stop,
                                   all 9 recovery sources (A–I)
8.  Email_Manager_Flow.md        — all 3 autonomy levels + 5-condition gate
9.  Emergency_Archetype_Flow.md  — full journey map (complete Step 4 build)
10. Commerce_Archetype_Flow.md   — full journey map, both sub-variants
                                   (Ecommerce + Restaurant), rebuilt in the
                                   Commerce Step 4 pass — PARTIAL status
                                   removed
11. Appointment_Archetype_Flow.md — full journey map, rebuilt in the
                                   Appointment Step 4 pass — PARTIAL
                                   status removed
12. Engagement_Archetype_Flow.md — full journey map, four parallel
                                   paths (Donate/Volunteer/Attend/
                                   Passive Supporter) in one file,
                                   rebuilt in the Engagement Step 4
                                   pass — PARTIAL status removed
13. Consultation_Archetype_Flow.md — full journey map, both sub-
                                   variants (Marketing Agency + Travel
                                   Agency), rebuilt in the Consultation
                                   Step 4 pass — PARTIAL status removed
14. Escalation_Map.md            — all escalation triggers → Priority
                                   classification → routing, unified across
                                   every module and step
```

**All five archetype flowcharts are now complete.** Flowcharts 9–13 (Emergency, Commerce, Appointment, Engagement, Consultation) each had a Step 4 Archetype Operating System pass built and each flowchart file rebuilt in full — none remain in `PARTIAL` status. This closes the flowchart-completeness gap that existed from Step 6's original pass through the end of the Commerce/Appointment/Engagement/Consultation Step 4 builds.

**Commerce Step 4 build (addition):** `Commerce_Archetype_Flow.md` was rebuilt in full once the Commerce Step 4 Archetype Operating System was completed — both Ecommerce and Restaurant sub-variants are diagrammed with explicit Module Ownership annotations at every handoff node, matching the depth of `Emergency_Archetype_Flow.md`. The `PARTIAL` status header and `Gap` subgraph were removed.

**Appointment Step 4 build (addition):** `Appointment_Archetype_Flow.md` was rebuilt in full once the Appointment Step 4 Archetype Operating System was completed — the existing-booking reschedule/cancellation handoff, practitioner-specific availability scoping, safety/access-critical special-request escalation, and the new system-triggered No-Show Recovery sub-flow are all diagrammed with explicit Module Ownership annotations, matching the depth of `Emergency_Archetype_Flow.md` and `Commerce_Archetype_Flow.md`. The `PARTIAL` status header and `Gap` subgraph were removed.

**Engagement Step 4 build (addition):** `Engagement_Archetype_Flow.md` was rebuilt in full once the Engagement Step 4 Archetype Operating System was completed. Unlike every prior archetype flowchart, this one represents a shared Entry/Trust-Building opening feeding into FOUR parallel subgraphs (Donate, Volunteer, Attend, Passive Supporter) — a single flowchart file was judged clearer than three or four separate linked files, since the shared Entry logic all paths depend on would otherwise need duplication or cross-file referencing. The Passive Supporter path is diagrammed as a genuine first-class subgraph with its own success-criteria node, not a fallback branch off another path. The `PARTIAL` status header and `Gap` subgraph were removed.

**Consultation Step 4 build (addition, FINAL archetype build):** `Consultation_Archetype_Flow.md` was rebuilt in full once the Consultation Step 4 Archetype Operating System was completed — Marketing Agency and Travel Agency are diagrammed as two fully independent subgraphs (per Commerce's two-sub-variant precedent, not Engagement's shared-entry pattern, since these two don't share a conversational entry point), each showing the full Discovery-Depth-Is-Enough decision gate, the Intent-03 shortcut override, and all three score-tier outcomes (including the 70-84 real-time high-intent treatment as a distinct node, not folded silently into the 50-84 band). The `PARTIAL` status header and `Gap` subgraph were removed. With this rebuild, all 14 flowchart files — including all five archetype flowcharts — are complete.

**Rendering verified:** YES — all 14 files independently validated using an actual Mermaid parser (Node.js + `mermaid.parse()` via a JSDOM-backed environment, the same method used for the Batch 1 Mermaid syntax fix), not just structural bracket/fence-balance checks. Result: 14/14 PASS, including the newly rebuilt Commerce_Archetype_Flow.md, Appointment_Archetype_Flow.md, Engagement_Archetype_Flow.md, and Consultation_Archetype_Flow.md.

---

## STEP 6 COMPLETION SUMMARY

- **Flowcharts created:** Universal_Runtime_Flow.md / Service_Routing_Map.md / Data_Collection_Map.md / Core_Agent_Flow.md / Growth_Agent_Flow.md / Conversion_Engine_Flow.md / Recovery_Engine_Flow.md / Email_Manager_Flow.md / Emergency_Archetype_Flow.md / Commerce_Archetype_Flow.md / Appointment_Archetype_Flow.md / Engagement_Archetype_Flow.md / Consultation_Archetype_Flow.md / Escalation_Map.md — 14 of 14, ALL COMPLETE (no partials remain).
- **Rendering verified:** YES — updated during the Commerce Step 4 pass to actual Mermaid-parser validation (Node.js + `mermaid.parse()`, JSDOM-backed), not just structural syntax checks; re-run during the Appointment, Engagement, and Consultation Step 4 passes. 14/14 PASS on every pass, including the final Consultation rebuild.
- **Decisions made:**
  - Flowcharts 1–8 and 14 (runtime layer, all 5 service modules, escalation map) are fully built from frozen, approved architecture — no gaps, no placeholders.
  - Flowcharts 10–13 (Commerce, Appointment, Engagement, Consultation) were each built as explicitly-labeled partial diagrams at Step 6's original pass, then rebuilt in full one at a time as each archetype's own Step 4 pass completed — this was judged the better failure mode than either silently inventing Step-4-equivalent content that was never approved, or leaving items from the required 14-file list completely absent. All four have since been rebuilt and are no longer partial — see each build's own "addition" note above.
  - Escalation_Map.md consolidates triggers from every module (Core Agent, Conversion Engine, Recovery Engine, Email Manager) plus the cross-cutting Step 1.H Global Active Issue Lock into one map, since escalation logic was scattered by design across the frozen architecture and a builder would otherwise need to cross-reference 5+ sections to see the full picture.
- **Open questions:**
  - None remaining specific to flowchart completeness — all five archetype flowcharts are now built and validated. Any remaining open questions are tracked per-archetype in each Step 4 build's own completion summary (Emergency, Commerce, Appointment, Engagement, Consultation) and consolidated in Appendix C's cross-archetype deferred-gap list.
  - **Resolved (Commerce Step 4 pass, reconfirmed on every subsequent Step 4 pass through Consultation):** A live Mermaid parser (not just structural checks) is now confirmed available in this environment (Node.js + `mermaid` + `jsdom`) and was used to validate all 14 flowchart files on every pass, including all four rebuilt archetype flowcharts (Commerce, Appointment, Engagement, Consultation) — this closes the "no live Mermaid renderer available" open item for parse-validity purposes. Visual/cosmetic rendering (layout, readability) still benefits from a live editor pass but is no longer an unverified syntax risk.
- **Step 6 review patches applied (post-review, pre-Step-7):**
  1. **Email Status ↔ Integration Contract alignment (LOW severity):** Module 5 Section 2.3 now includes an explicit one-to-one mapping of every status-setting point in Module 5's flows to exactly one of the Integration Contract's 8 allowed Email Status values (New / Human Review Required / Draft Ready / Sent / Auto Replied / Escalated / Closed / Error) — resolves the open cross-module inconsistency flagged in the STEP 3 ALL MODULES COMPLETION SUMMARY.
  2. **Mermaid style fix — Email_Manager_Flow.md:** Removed the empty `TimeCheck` subgraph (a subgraph with a label and no contained nodes); replaced with a plain annotation node carrying the same label and edges. Cosmetic only, no functional/logic change.
  3. **Mermaid style fix — Escalation_Map.md:** The `Classify` node's shape declaration (`Classify["Escalation Priority Classification..."]`) was previously written after 10 edges already referenced it bare — moved the shape declaration to precede its first use, so the node's shape is unambiguous from first reference rather than depending on renderer-specific handling of forward-declared shapes. Cosmetic only, no functional/logic change.
  4. **Archetype Step 4 completion (Commerce/Appointment/Engagement/Consultation):** Confirmed as expected future work, not a defect in this pass — no action taken here; tracked in Flowcharts 10–13's own Open Questions above.
- **Ready for architect review:** YES

---

`Agent_Runtime_System_v1.md` is complete pending final review. Per architect review: Architecture PASS, Runtime PASS, Modules PASS, Flowcharts PASS, Implementation Readiness YES. **FINAL VERDICT: APPROVED FOR BUILD.**

---

## APPENDIX A — Integration Contract v2 Requirements

Fields required in Integration Contract v2, surfaced throughout Steps 0–3. No existing functionality is blocked by these gaps — they represent planned enhancements to the data model.

```
CUSTOMER RECORD ADDITIONS:
  customer_preferences (structured field, not conversation_summary text)
  active_issue_owner (Human / LiveConversation / EmailManager /
                      RecoveryEngine / Automation / None)
  channel_identity_graph (links email/phone/chat/WhatsApp IDs to
                          one Unified Customer Profile)
  reactivation_threshold_override (per-customer override of archetype
                                   default dormancy threshold)

LEAD RECORD ADDITIONS:
  recovery_status_scheduled (explicit "cadence created, first step
                              not yet fired" state, distinct from Active)

EMAIL RECORD ADDITIONS:
  thread_lifecycle (Open / Waiting-Customer / Waiting-Business /
                    Resolved / Stale)
  email_bounce_status (Delivered / Bounced / Spam-Complaint /
                       Delivery-Failed)
  thread_owner (AI / Human / Collaborative)

ESCALATION RECORD:
  escalation_type, escalation_reason, escalation_priority,
  origin_module, trigger_condition (named in Module 1D — Human
  Handoff Handler, Escalation Priority Classification)

CONVERSION RECORD ADDITIONS:
  conversion_state (INTENT_CONFIRMED / DATA_COLLECTION /
                    ACTION_PENDING / CONFIRMED / FAILED_RECOVERABLE /
                    FAILED_ESCALATION / CANCELLED)
  conversion_mode (A / B / C, per archetype)
  source_module (growth_agent / direct — no handoff payload)
  external_action_status (success / failed_recoverable /
                          failed_escalation / not_attempted)
  failure_reason (text — API error type, system unavailable, etc.,
                  if applicable)
  recovery_eligible (boolean)
  validation_flag (boolean)
  validation_notes (text)

GROWTH TRACKING (new table or fields):
  growth_buying_stage, recommended_solution, recommendation_reason,
  objection_type, objection_resolved, upsell_offered, upsell_accepted,
  growth_exit_type

GROWTH-TO-CONVERSION HANDOFF PAYLOAD (Module 2 §3, Resolved Q2 —
  conceptually defined at handoff, not yet a formal Integration
  Contract structure):
  intent, selected_solution, resolved_objections, pending_questions,
  captured_contact_fields (customer_preferences and source_module are
  part of this same payload but already tracked above, under CUSTOMER
  RECORD ADDITIONS and CONVERSION RECORD ADDITIONS respectively)

RECOVERY RECORD ADDITIONS:
  recovery_context (structured reference to prior conversation context,
                    recovery step number, last message content)
  human_ownership_flag (boolean, controls Paused state resumption)
  suppression_only_record (a lightweight record type: contact_method +
                           opt_out_timestamp, independent of any
                           Lead/Recovery record existing)

BUSINESS CONFIG ADDITIONS:
  send_window_start (time, default 08:00 local)
  send_window_end (time, default 20:00 local)
  after_hours_emergency_contact (text, optional — surfaces to
                                 customer when human queue unavailable
                                 during active emergency)
  default_country_code (string, e.g. "+1" — set "ASK" for
                        multi-region deployments)
  max_booking_horizon (integer, days — default 365)
  appointment_selfservice_link_enabled (boolean, default false — per
                 Module 3 §3 Appointment, Guided Self-Service Booking
                 sub-type; if false, Mode B is Request Booking only)
  language_mode (fixed | adaptive — default adaptive, per Step 1C)
  language_list (array of supported languages, business-configured —
                 default single entry matching the business's primary
                 operating language, per Step 1C)
  cart_value_escalation_threshold (currency amount, business-configured
                 — default unset (no automatic threshold), per Step 4
                 Commerce Ecommerce §5)
  backorder_notification_enabled (boolean, default false — per Step 4
                 Commerce Ecommerce §5 out-of-stock handling)
  program_reactivation_notification_enabled (boolean, default false —
                 per Step 4 Engagement Attend §5/§6 program-not-active
                 handling)
  realtime_high_intent_alert_enabled (boolean, default true — per Step
                 4 Consultation §6, extends the existing WF-302
                 sales-team alert to fire at initial 70-84 scoring,
                 not only at later recovery steps)
```

---

## APPENDIX B — Step 4 Architecture Flags

Issues to address when building archetype operating systems in Step 4. These do not require changes to Steps 0–3.

```
FLAG 1 — Home services non-emergency flow:
  Non-urgent home service requests (quote for roof replacement,
  routine maintenance) don't fit cleanly into Emergency archetype
  (assumes active crisis) or Appointment archetype (assumes personal
  service). Emergency Step 4 should explicitly define a
  "non-emergency / quote request" branch distinct from the
  triage/dispatch flow.

FLAG 2 — Human unavailability:
  Priority 1 escalation (Safety/Emergency) assumes a human is
  available to receive the handoff. What happens at 2am when no
  human is online? This needs definition in Step 4 Emergency
  archetype specifically, and a general fallback rule for all
  archetypes when Priority 1/2 escalation is needed but the
  human queue is unmanned.

FLAG 3 — Language mismatch: — **RESOLVED** (Batch 3 Round 4, Language
  Config Fix — Step 1C). This is a universal rule, not a per-archetype
  decision: `language_mode`/`language_list` (Step 1C) define adaptive
  detection-and-match within the business-configured language list;
  an unsupported language falls back to the list's primary language
  with the limitation noted naturally, rather than routing to a human.
  See Step 1C "Language configuration" for the full contract.

FLAG 4 — Design principle for all future archetype builds:
  Never route channel or escalation decisions based on assumed
  customer age/generation preferences. Research (McKinsey 2024,
  3,500-consumer survey) found no reliable age-based phone-aversion
  pattern — Gen Z respondents were found 35-40% more likely to call
  for complex issues than older cohorts, driven by issue complexity,
  not generational preference. Use task complexity (per Module 1
  Human Handoff Handler's Underlying Rationale note) as the routing
  signal, never demographic assumption.
```

**Batch 2 Phase 3 amendment applied (Part B):** Flag 4 added (P2/B7, McKinsey 2024, 3,500-consumer survey) — a preventive design principle for future Step 4 archetype builds, since no age-based channel logic currently exists to correct, but the finding is strong enough to guard against future drift.

---

## APPENDIX C — Cross-Cutting Future Task Tracking

**Related:** For the operational framework (version tracks, promotion
criteria, KPI measurement) that governs how changes to this document's
specifications get deployed and measured across live clients, see
`00_Project_Control/Version_Control_and_KPI_Framework.md`.

Unlike Appendix B (scoped specifically to Step 4 archetype-build issues), this appendix tracks document-wide future tasks that don't belong to any single archetype or module.

```
FLAG — Implementation Reference Retrofit (Future Task, Not Current Scope):
  This document contains numerous specific references to Airtable, n8n,
  Voiceflow/Convocore, and the Integration Contract, written when those
  were the only implementation targets. The Implementation Independence
  principle (document header) establishes the correct reading lens for
  these references now, but a future dedicated pass should audit every
  such reference and rewrite it in abstracted pattern form (per the
  principle's examples) — this is explicitly NOT done in Batch 3 Round 2,
  to avoid uncontrolled scope creep touching approved content across
  every module simultaneously. Schedule as its own task when platform
  migration planning becomes concrete.


FLAG — Consolidated Step 4 Archetype-Build Deferred Gap List (Post-Step-4
Scan Input, Not Current Scope):

  All five archetype Step 4 builds (Emergency, Commerce, Appointment,
  Engagement, Consultation) are now complete. Across all five, every
  gap deliberately flagged-rather-than-fixed (per the "flag, don't
  invent" discipline established in the Stress Test Library and
  applied consistently in every Step 4 build since) is consolidated
  here as a single input list for the comprehensive post-Step-4
  document scan already planned as a separate task. Nothing in this
  list is resolved by this entry — it is an index, not a fix.

  A) PRE-EXISTING, CROSS-ARCHETYPE GAPS (Stress Test Library, still open):
     1. Off-Topic Counter Reset Rule (Module 1 E) does not explicitly
        cross-reference that a Priority 3+ interrupt (e.g., Human
        Request) overrides the redirect count independent of topic
        classification — inferable from Step 1E, not stated in Module
        1 E itself. (Stress Test Library Open Gap 1 / IS-03)
     2. Memory Conflict Resolution (Step 0C §3) defines cross-level
        priority (Business > Session > Customer History > Assumption)
        but not same-level (Session vs. earlier-Session within one
        conversation) conflict resolution — "most recent wins" is
        inferable, not written as an explicit rule. (Open Gap 3 /
        MC-03)
     3. Email validation (Step 0B §7.1) is format-only; cannot
        distinguish a genuinely fake-but-well-formed placeholder
        ("test@test.com") from a real address. (Open Gap 4 / DR-02)
     4. Date/Time validation (Step 0B §7.1) assumes an already-resolved
        date; the boundary between natural-language relative-date
        resolution ("next Tuesday," "December") and Step 0B §7's
        format/range validation is not drawn. Flagged independently
        during the Commerce, Appointment, Engagement, AND Consultation
        Step 4 builds — every date-collecting archetype is equally
        exposed. (Open Gap 6 / DV-02 — the most-repeated flag across
        all five archetype builds.)
     5. Language mismatch (Appendix B Flag 3 / Open Gap 8) — **CONFIRMED
        RESOLVED AND CLOSED** during the comprehensive post-Step-4 scan.
        The Language Config Fix (Adaptive-Bounded `language_mode`/
        `language_list` contract, Step 1C) fully answers this as a
        universal (not per-archetype) rule: adaptive detection-and-match
        within the configured language list, falling back to the
        primary language (with the limitation noted naturally) for
        unsupported languages — never a human route. Appendix B Flag 3
        and Stress Test Library Open Gap 8 have both been updated with
        explicit cross-references to Step 1C closing this item.

  B) NEW ENTERPRISE EXPANSION / INTEGRATION CONTRACT GAPS (surfaced
     during the four post-Emergency Step 4 builds):
     6. Complementary-item mapping data model (Commerce Ecom) — Bundle/
        Upsell resolution assumes Business Memory can hold structured
        "customers who bought X also need Y" data; schema not defined
        anywhere in the Integration Contract.
     7. Full booking/appointment/reservation lifecycle (flagged by
        Module 3's own completion summary, restated as directly
        relevant by both Commerce Restaurant and Appointment builds) —
        Created → Confirmed is fully defined; Reminder Sent →
        Reschedule Requested → Cancelled → No-Show → Reactivation are
        not.
     8. Pre-arrival dietary/special-request confirmation tracking
        (Commerce Restaurant, Appointment) — no field/workflow tracks
        whether a required pre-arrival human confirmation actually
        happened before the appointment/reservation time.
     9. No-show detection mechanism (Appointment) — the system-
        detected "appointment time passed, no check-in" signal this
        build's Recovery trigger depends on is not defined anywhere in
        the Integration Contract (webhook or scheduled-trigger poll,
        per Step 1.0.1's External Event Entry Point pattern).
     10. Practitioner-level calendar granularity (Appointment) — the
         practitioner-specific Availability Validation Layer assumes
         the calendar integration can query by individual practitioner,
         not just by business/location; not confirmed in the
         Integration Contract's Demo Phase Rules.
     11. Tribute/memorial donation record structure (Engagement) —
         honoree name/contact fields are not yet defined anywhere in
         the Integration Contract's Conversion Record schema.
     12. General outbound opt-in tracking (Engagement) — the passive-
         supporter resolution depends on a Business Memory/CRM-level
         "general updates opt-in" concept distinct from both Lead and
         Recovery records; referenced as the landing place for that
         data but not itself defined in the Integration Contract.
     13. Volunteer live-capacity data feed (Engagement) — the Volunteer
         Confidence Gate assumes Business Memory CAN contain live
         program-capacity data, but no integration pattern for keeping
         that data current is defined. **Resolved for v1** via Module 3
         §2.1's v1 Fallback Configuration (`client_config.
         engagement_capacity_check_mode`, default `dashboard_request` —
         a human confirms capacity rather than the agent asserting it
         automatically). Building the live feed itself remains deferred
         to v2, not an open v1 blocker.
     13a. Emergency team/technician dispatch-capacity feed and
         Consultation specialist-availability feed — the same category
         of gap as item 13, named in Module 3 §2.1 but never previously
         logged in this consolidated list. **Resolved for v1** the same
         way, via `client_config.emergency_booking_mode` and
         `client_config.consultation_specialist_check_mode` respectively
         (both default `dashboard_request`). Building either live feed
         remains deferred to v2.
     14. Required scoring-input field registry (Consultation) — the
         Discovery-Depth-Is-Enough Confidence Gate condition depends on
         "business-configured required scoring-input fields" existing
         somewhere in Business Memory/the scoring integration; this is
         assumed as a downstream dependency, not itself defined here,
         consistent with the scoring-mechanism-out-of-scope boundary.

  C) OPEN ARCHITECT-REVIEW JUDGMENT CALLS (per-archetype, flagged for
     confirmation rather than presumed correct):
     15. Emergency: Inspection Slot Booking assumes the same calendar
         infrastructure Conversion Engine uses elsewhere is available
         for Home Services businesses specifically — not confirmed.
     16. Emergency: the "on behalf of someone else" branch allows the
         caller's own contact number to stand in for the affected
         party's — architect should confirm this is acceptable across
         all configurations, ties to Module 1's Customer Verification
         Rule (high-risk-action tier).
     17. Commerce: cart-value escalation threshold defaults to
         "unconfigured = no gate" — architect should confirm this is
         the correct permanent behavior vs. a sensible built-in
         default.
     18. Commerce Restaurant: safety-relevant dietary restriction's
         Priority 2 classification — could arguably be read as
         Priority 1 under Module 1's own P1 examples if the reservation
         is imminent.
     19. Appointment: safety/access-critical special-request Priority 2
         classification is calibrated more conservative than
         Restaurant's equivalent (booking not finalized at all vs.
         confirmed-but-flagged) — architect should confirm this
         asymmetry between the two archetypes is intentional.
     20. Appointment: no-show follow-up's default send window (same-
         day, end-of-business-hours) is this build's own reasonable
         default, not sourced from existing config — may warrant a
         dedicated configurable field.
     21. Appointment: post-booking Opportunity Detection's re-entry
         mechanism (Conversion Engine handing control back to Growth
         Agent after CONFIRMED) is described narratively, not as a
         formal Conversion State Machine transition (Module 3 §1.1) —
         architect should confirm this is sufficient as written.
     22. Engagement: the passive-supporter long-term-ownership
         resolution (neither Growth Agent nor Recovery Engine owns it
         continuously) assumes Zenny is not expected to run an ongoing
         newsletter/drip program as core runtime scope — architect
         should confirm, or consider a future dedicated module for
         this space.
     23. Consultation: Travel Agency's large/complex-trip routing is a
         qualitative judgment ("large or complex"), not a specific
         numeric threshold like Commerce's `cart_value_escalation_
         threshold` — architect should confirm whether a number is
         warranted.
     24. Consultation: `realtime_high_intent_alert_enabled` defaults to
         TRUE (unlike the opt-in pattern used for Commerce's/
         Engagement's customer-facing notification flags) — architect
         should confirm this default is correct given it's an
         internal-only extension of already-existing infrastructure
         (WF-302), not a new customer-facing capability.
     25. Consultation: the SPIN-stage vocabulary (Situation/Problem/
         Implication/Need-payoff) is introduced at the Step 4 level as
         a naming clarification, not retrofitted into Module 2's
         Discovery Flow text itself — architect should confirm this is
         an acceptable pattern (same relationship as Universal Mode
         Naming has to Module 3) rather than requiring a Module 2
         retrofit for full internal consistency.

  This list is an INPUT to the comprehensive post-Step-4 scan, not a
  substitute for it — the scan should verify each item's current
  status (some, like item 5, may already be resolved and simply need
  formal closure) rather than assume this list is exhaustive or still
  fully accurate by the time that scan runs.
```
