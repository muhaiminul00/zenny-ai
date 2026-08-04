# ZEROMANUAL — VOICEFLOW UNIVERSAL BUILD STANDARD
## Mandatory Implementation Rules — Applies to ALL Agents
### (Ember & Co · GlowWell Studio · Precision · GrowthPath)

These rules override any earlier workflow-based instructions in the 
original spec docs. They were derived from real implementation errors. 
Every builder, every agent, every playbook follows these without 
exception. This document is the single source of truth for HOW we 
build in Voiceflow — the business architecture docs remain the source 
of truth for WHAT we build.

---

## RULE 1 — NO WORKFLOWS (except Initialization)

Voiceflow Workflows are NOT used for business logic, tool calls, or 
routing. Reason: API/Global Tools only work in agentic contexts 
(Playbooks). Workflows cannot call them.

✅ ALLOWED workflow: Initialization Workflow only — runs once at 
   conversation start, sets static startup variables (business, 
   archetype, lead_status, escalation_flag, lead_score = 0).

❌ NOT ALLOWED: Any "WF-VF-0X" style workflow for intent routing, 
   lead capture, conversion request, escalation request, or webhook 
   submission. These are deleted from the build plan entirely.

✅ INSTEAD: 
   - Routing → Instructions tab + LLM Description on each playbook
   - Lead capture → inside Core Lead Capture playbook
   - Conversion → inside the relevant Conversion playbook
   - Escalation → inside Core Escalation Detection playbook
   - Final submission → handled inline where applicable (see Rule 8)

---

## RULE 2 — VARIABLE SYNTAX

Every variable reference — anywhere, in any field, in any context — 
uses single curly brace syntax:

  {variable_name}

This applies to:
  - Playbook instruction text
  - Set step values
  - API tool payload fields
  - Message step text
  - Condition checks

❌ WRONG:  customer_name
❌ WRONG:  {{customer_name}}
✅ RIGHT:  {customer_name}

No exceptions. No double braces. No bare variable names. Check every 
field before marking a playbook complete.

---

## RULE 3 — PLAYBOOKS ARE FULLY SELF-CONTAINED

No workflow exists to catch what a playbook misses. Every playbook 
must explicitly define, in its own instructions:

  a) ACTIVATION — exactly when this playbook turns on
  b) SEQUENCE — what happens first, second, third
  c) EDGE CASES — what to do if the customer interrupts, asks an 
     off-topic question, refuses to answer, changes their mind, or 
     goes silent
  d) TOOL CALLS — exact tool name, exact variables passed, exact 
     variables stored from the response (see Rule 4 format)
  e) COMPLETION CONDITION — how the playbook knows it is done
  f) NEXT STEP — which playbook or action comes next, and under 
     what condition
  g) NEXT-STEP NUDGE — natural close that moves toward conversion 
     (see Rule 5)

A playbook that does not define all 7 of the above is incomplete. 
Do not consider a playbook "done" until every one is explicit.

---

## RULE 4 — API TOOL CALL FORMAT (write exactly like this in playbooks)

When a playbook needs to call a tool, write the instruction in this 
exact plain-language pattern:

  "After collecting {field_a}, {field_b} — call '[Tool Name]' tool 
   passing {field_a}, {field_b}. Store {returned_field_x}, 
   {returned_field_y} from the response."

Example:
  "After collecting {customer_name}, {customer_email}, 
   {customer_phone} — call 'Create Lead' tool passing {business}, 
   {customer_name}, {customer_email}, {customer_phone}, {intent}, 
   {source_channel}. Store {lead_id}, {lead_score}, {score_tier}, 
   {recovery_profile} from the response."

Rules for this pattern:
  - Tool name in single quotes, exact match to the tool's configured 
    name in Voiceflow
  - List every variable being passed — do not write "relevant 
    variables" or similar vague language
  - List every variable being stored from the response — do not skip 
    this even if it seems obvious
  - State the trigger condition before the call ("After collecting 
    X" / "Once Y is confirmed" / "When Z is true")

---

## RULE 5 — SALES MINDSET (applies to EVERY playbook, including Core FAQ)

The agent's underlying goal in every interaction: serve what the 
customer asked for, then move them naturally toward becoming a lead, 
then toward becoming a conversion (purchase/booking/appointment).

This must NEVER feel like a sales push. It must feel like a helpful 
person who happens to know the natural next step.

Every playbook — Core FAQ included — closes its response with a 
soft next-step nudge. Never end on a flat, closed answer with nothing 
after it.

❌ BAD (Core FAQ, no nudge):
  "Returns are accepted within 30 days of delivery."

✅ GOOD (Core FAQ, with nudge):
  "Returns are accepted within 30 days of delivery. While you're 
   here — were you looking at something specific, or can I help 
   you find something?"

The nudge must:
  - Feel like a natural continuation, not a bolt-on sales line
  - Be skippable — if the customer ignores it, do not repeat or 
    push harder
  - Connect logically to what was just discussed
  - Never feel scripted or template-like twice in the same 
    conversation — vary the phrasing

---

## RULE 6 — BUTTONS AND CAROUSELS (use liberally, not just yes/no)

System Tools — Buttons and Carousel — must be used wherever they 
reduce typing friction and make the agent feel like it already 
anticipated the customer's need. This is core to making the agent 
feel human rather than agentic/robotic.

CAROUSEL — use when presenting multiple options of the same kind:
  - Multiple product recommendations
  - Multiple service options
  - Multiple appointment slots
  - Multiple package tiers

BUTTONS — use far beyond yes/no. Use buttons whenever there is a 
small, finite set of likely next actions, including:
  - Confirm / Change something
  - Selecting between 2–4 named options ("This one" / "Show me 
    something else")
  - Quick replies to qualifying questions (e.g. "Casual" / "Smart 
    casual" / "Formal")
  - Closing a recommendation ("Add to order" / "Tell me more" / 
    "Show alternatives")

PRINCIPLE: If the agent can predict the likely responses, offer 
them as buttons. The customer should feel like they don't need to 
think or type — the agent already guessed what they want. This is 
what makes the experience feel like a sharp human assistant rather 
than a form-filling bot.

Do not overuse buttons to the point of removing natural conversation 
— open-ended questions (e.g. "What's the occasion?") still get a 
text response. Buttons are for narrowing/confirming, not for 
everything.

---

## RULE 7 — DATE/TIME COMMON SENSE

Every playbook that collects a date or time must resolve relative 
language using Voiceflow's built-in variables:

  {vf_now}              — current timestamp
  {vf_user_timezone}    — customer's timezone

REQUIRED BEHAVIOR:
  - "Today" → resolve to the actual current calendar date using 
    {vf_now} in {vf_user_timezone}. Never ask the customer to 
    restate today's date.
  - "Tomorrow" / "Yesterday" → resolve relative to {vf_now} the 
    same way.
  - Day-of-week references ("this Friday", "next Monday") → resolve 
    to the actual upcoming date.
  - TIME-PASSED CHECK: if the customer requests a time on the 
    current date that has already passed relative to {vf_now}, the 
    agent must catch this and flag it naturally — never silently 
    accept a booking time in the past.

    Example: current time 13:30. Customer says "today at 11:30."
    Agent must respond: "Just to flag — 11:30 today has already 
    passed. Did you mean tomorrow at 11:30, or a different time 
    today?"

  - Never silently book, confirm, or pass a past timestamp into any 
    tool payload.

This rule applies to any playbook handling reservations, 
appointments, bookings, or callback scheduling — across all 
archetypes (Commerce/Restaurant, Emergency, Appointment, 
Consultation).

---

## RULE 8 — LEAD CAPTURE FIRES IMMEDIATELY, NOT AT CONVERSATION END

Create Lead tool call happens INSIDE Core Lead Capture playbook, 
immediately after {customer_name}, {customer_email}, and 
{customer_phone} are all collected. It does NOT wait until the end 
of the conversation.

SEQUENCE:
  1. Core Lead Capture collects all 3 contact fields
  2. Immediately calls 'Create Lead' tool
  3. Stores {lead_id}, {lead_score}, {score_tier}, 
     {recovery_profile} from the response
  4. Routes to whichever playbook was waiting (Product Advisor / 
     Dining Advisor / Service Advisor / Booking Assistant / etc.)

WHY THIS MATTERS:
  - {lead_id} becomes available early and must be included in every 
    subsequent tool call (Create Conversion, Create Escalation)
  - Removes the old problem of conversation_summary being assembled 
    too late
  - A conversation that drops off after lead capture still has a 
    persisted lead record — nothing is lost

conversation_summary, when assembled later for Create Conversion or 
Create Escalation, should still capture the FULL conversation up to 
that point — not just what happened after lead capture.

---

## RULE 9 — LEAD vs CONVERSION DEFINITION (terminology, applies everywhere)

  LEAD       = An interested person. Created the moment Create Lead 
               tool fires (Rule 8). lead_status = "New" or 
               "Qualified."

  CONVERSION = A lead who completed the target action — purchased, 
               booked, reserved, or scheduled. Created when Create 
               Conversion tool fires. lead_status updates to 
               "Converted."

Every playbook must be clear about which state the customer is in 
and which tool applies. Do not call Create Conversion on someone 
who has not yet become a lead (i.e. Create Lead must have already 
fired and returned a {lead_id} before Create Conversion is called).

---

## RULE 10 — EVERYTHING IN VOICEFLOW NEEDS A DESCRIPTION

Voiceflow's agent reasons using descriptions, not just raw content. 
Anything without a description is invisible to the agent's decision 
making, even if it technically still functions. Every object built 
in Voiceflow gets a description at build time — not added later, 
not skipped because "it still works without it."

WHAT NEEDS A DESCRIPTION, AND WHAT IT MUST SAY:

  PLAYBOOKS
    → LLM Description field
    → A brief identity + purpose summary: what this playbook is, 
      and when the agent should use it
    → This is what powers routing — the agent reads this to decide 
      whether to hand off to this playbook
    → Already covered in practice under Rule 1 routing — but the 
      description itself is the deliverable, not optional polish

    Example:
    "Use this when the customer asks about products, needs a 
     recommendation, asks about sizing or materials, or wants to 
     know what to buy. Leads to purchase intent."

  WORKFLOWS (Initialization only, since Rule 1 limits workflows)
    → Same as playbooks — brief description of purpose and when 
      it runs

  VARIABLES
    → Description field on the variable itself
    → States what this variable stores and what it is FOR — not 
      just a restatement of the name
    → Helps the agent decide when to read from or write to it 
      correctly, especially for variables with non-obvious purpose

    Example:
    Variable: recovery_profile
    Description: "Stores which recovery cadence applies to this 
    lead (Commerce / Emergency / Appointment / Consultation). 
    Set by n8n after Create Lead — do not set this manually."

    Example:
    Variable: cart_value
    Description: "Running total value of items the customer has 
    selected. Used to check against the 3x AOV escalation 
    threshold before Purchase Assistant activates."

  API TOOLS
    → TRIGGER DESCRIPTION: one line, what this tool does and when 
      to call it
    → INPUT VARIABLE DESCRIPTIONS: one line per parameter, what 
      that specific input is for

    Example tool: Create Conversion
    Trigger Description: 
      "Call this when a customer has confirmed a purchase or 
       reservation and all pre-conditions have passed. Creates 
       the conversion record in Airtable via n8n."
    
    Input parameter descriptions:
      lead_id          → "The lead_id returned earlier from 
                           Create Lead. Required."
      conversion_type  → "Either 'Purchase' or 'Reservation' — 
                           must match exactly."
      cart_value       → "Total order value in the cart, used 
                           for AOV validation downstream."

  KNOWLEDGE BASE (per playbook KB toggle)
    → LLM Description for the KB System Tool inside each playbook 
      that uses it
    → States what kind of questions this KB answers

    Example:
    "Use this to answer any customer question about Ember & Co 
     products, policies, shipping, returns, menu, or restaurant 
     information."

WHY THIS MATTERS:
  Without descriptions, the agent can still technically call a tool 
  or read a variable if explicitly told to in playbook instructions 
  — but it loses the ability to reason independently about WHEN and 
  WHY to use something. Descriptions are what let the agent behave 
  intelligently in edge cases the playbook instructions didn't 
  explicitly anticipate. Skipping descriptions trades reliability 
  for short-term speed — and shows up later as routing errors or 
  tools called with wrong/missing context.

LENGTH: One to two sentences is enough. Do not over-write these. 
Clear and specific beats long and thorough.

---

## RULE 11 — GRACEFUL DEGRADATION (every agent, every layer)

The agent must never let a single failure break the customer 
experience. Every dependency — tool call, KB search, date parsing, 
even the LLM itself — can fail. The agent's job is to keep the 
conversation moving forward in a degraded but still useful state, 
never dead-end the customer, and never expose the failure as a 
technical error.

This mirrors the same philosophy already built into n8n (WF-501 
Error Logger + fallback content + retry-once pattern). Voiceflow 
is the customer-facing layer — it degrades the same way, but 
customer-side instead of system-side.

### LEVEL 1 — TOOL CALL FAILURE (Create Lead / Create Conversion / 
### Create Escalation)

If a tool call fails or times out:
  - Retry once, silently — no message to customer during retry
  - If retry also fails:
      → Do NOT tell the customer "there was a system error" or 
        expose any technical language
      → Say something natural: "Let me just get this confirmed for 
        you — one moment." then attempt a graceful close:
        "I've got your details — our team will reach out to confirm 
        everything shortly." 
      → Treat as escalation-worthy: set {escalation_flag = true}, 
        {escalation_reason = "Tool call failed after retry — 
        manual follow-up required"}, attempt Create Escalation tool 
        once
      → If Create Escalation ALSO fails — do not loop further. 
        End the conversation gracefully with a message that does 
        not block the customer:
        "Thanks for chatting — our team will follow up with you 
         directly."
  - Never let the customer get stuck waiting on a tool that won't 
    respond. There is always a graceful exit message.

### LEVEL 2 — KNOWLEDGE BASE FAILURE / NO RESULT

Already covered under existing escalation rules (KB can't answer → 
escalate). Graceful degradation here means the escalation itself 
must feel natural, not abrupt:

  ❌ "I don't have that information."
  ✅ "That's a great question — let me get you to someone who can 
      give you the exact details. One moment."

### LEVEL 3 — DATE/TIME PARSING FAILURE

If the agent cannot confidently resolve a relative date/time (Rule 
7) — for example, ambiguous input like "next week sometime":

  - Do NOT guess a specific date and silently proceed
  - Ask one clarifying question with buttons where possible 
    (e.g. "Early next week" / "Later next week" / "Let me give 
    a specific date")
  - If still unresolved after one clarification — fall back to:
    "No problem — I'll mark this as flexible and have our team 
     confirm the exact time with you."
  - Never pass an ambiguous or unvalidated date/time into a tool 
    payload

### LEVEL 4 — LLM / REASONING UNCERTAINTY

If the agent is uncertain how to respond (low confidence, 
contradictory signals, or a request outside any playbook's scope):

  - Default to escalation per Rule 5 of Global Instructions 
    ("If uncertain → escalate. Never guess.")
  - Degrade gracefully: acknowledge what the customer said, then 
    hand off — never go silent, never repeat the same clarifying 
    question more than once (ties into the 2-3 failed attempts 
    escalation trigger already defined)

### LEVEL 5 — CUSTOMER GOES SILENT / ABANDONS MID-FLOW

  - Do not chase aggressively or send multiple follow-ups in the 
    same session
  - If contact info was already captured (Rule 8 — Create Lead 
    already fired) → conversation degrades gracefully into a 
    recovery-queue case. Nothing is lost; n8n recovery cadence 
    picks it up later (per archetype-specific cadence)
  - If contact info was NOT yet captured → conversation simply ends. 
    No record, no error state. This is acceptable degradation, not 
    a failure

### CORE PRINCIPLE

At every failure point, ask: "What's the most natural, least 
broken-feeling thing a sharp human assistant would say right now?" 
That answer is the degraded response. The customer should never 
see a stack trace, a technical term, an apology loop, or a dead 
end. Worst case = "our team will follow up" — never "something 
went wrong."

Degradation always preserves whatever data was already collected. 
Never discard a partially completed lead or conversation because 
one step failed.

---

## RULE 12 — GLOBAL PROMPT + GLOBAL INSTRUCTIONS ARE THE AGENT'S BRAIN

Global Prompt and Global Instructions are not boilerplate sections 
to fill in quickly — together they ARE the agent. Every playbook, 
every tool call, every edge case handling sits downstream of these 
two. If either is shallow, generic, or rushed, every playbook built 
on top of it inherits that weakness, regardless of how well the 
individual playbooks are written.

Treat Global Prompt as the agent's IDENTITY and Global Instructions 
as the agent's OPERATING DISCIPLINE. Both must be archetype-specific 
— never copy-pasted between archetypes with just the business name 
swapped. A Commerce agent's brain is not a Consultation agent's 
brain wearing a different name.

### MINIMUM STANDARD FOR GLOBAL PROMPT (per archetype)

All 7 sections (Identity / Role / Business Goal / Communication 
Style / Authority Limits / Escalation Rules / Success Criteria) 
must reflect that archetype's actual agentic score and reasoning 
style — not a generic template:

  - Commerce/Restaurant (low agentic, 2-3/10) → Communication Style 
    must explicitly say "transactional efficiency," "one 
    recommendation at a time," short responses
  - Emergency (low agentic, 2/10) → Communication Style must say 
    "direct," "fast," urgency-aware language
  - Appointment (moderate agentic, 4/10) → Communication Style 
    allows some guided exploration
  - Consultation (high agentic, 8/10) → Communication Style 
    explicitly permits deeper discovery, multi-turn reasoning, 
    consultative tone

  Authority Limits and Escalation Rules must list the SPECIFIC 
  triggers for that business — not a generic "escalate when 
  needed." Pull these directly from the archetype's documented 
  escalation triggers (e.g. Precision's insurance-content ban, 
  GrowthPath's score gate, Ember's cart AOV threshold).

### MINIMUM STANDARD FOR GLOBAL INSTRUCTIONS (per archetype)

The 12 universal behavioral rules (Rule set already defined) apply 
to every archetype unchanged — these are non-negotiable platform 
rules. But Global Instructions is also where archetype-specific 
operating rules belong, appended below the universal 12. Examples:

  - Precision: explicit rule never to discuss insurance content
  - GrowthPath: explicit rule that Consultation Scheduler does not 
    activate below lead_score 50
  - Ember: explicit rule on cart AOV threshold check before 
    Purchase Assistant
  - GlowWell: explicit rule on upsell behavior boundaries

Do not assume a playbook-level rule is "enough" — if a rule is 
critical enough to never be violated, it belongs at the Global 
Instructions level too, since this is read by the agent on every 
single turn, not just within one playbook's scope.

### WHY THIS MATTERS

A playbook can be perfectly written and still fail if the agent's 
underlying identity and operating discipline are vague. Global 
Prompt + Global Instructions are evaluated FIRST and INFLUENCE 
EVERYTHING — tone, what counts as in-scope, when to escalate, how 
aggressively to push toward conversion. Treat building these two as 
seriously as building any playbook — never as a 10-minute formality 
before the "real" work starts.

---

## RULE 13 — {agent_first} VARIABLE (conversation opening control)

Every agent includes a control variable that determines whether the 
agent sends the first message or waits for the customer to speak 
first. This exists because different clients have different 
preferences for how their AI greets visitors — some want immediate 
proactive welcome, others want the agent to stay silent until 
engaged.

  Variable name:  {agent_first}
  Type:           Boolean
  Set in:         Initialization Workflow (Rule 1 exception)
  Default value:  true  (agent greets first, unless client specifies 
                   otherwise)

### BEHAVIOR

  {agent_first} = true
    → Agent sends a welcome/greeting message immediately at 
      conversation start, before waiting for any customer input
    → Greeting should be short, on-brand, and end with a natural 
      opening question or button set (per Rule 6) inviting the 
      customer to engage

  {agent_first} = false
    → Agent does NOT send anything on conversation start
    → Agent waits silently until the customer sends the first 
      message, then responds normally through standard routing

### IMPLEMENTATION

  - Set {agent_first} in the Initialization Workflow alongside the 
    other startup variables (business, archetype, lead_status, etc. 
    — see Rule 1)
  - Default to `true` at build time for every agent unless the 
    client has explicitly requested otherwise
  - This is a build-time/client-config toggle, not something the 
    customer or conversation changes mid-session
  - The actual greeting message content (if {agent_first} = true) 
    should live in the Global Prompt or a short Initialization 
    message step — keep it brief, on-brand, and consistent with 
    Rule 5 (soft next-step nudge) and Rule 6 (buttons where useful)

### EXAMPLE

  Ember & Co, {agent_first} = true:
    "Hey! Welcome to Ember & Co — I can help you find something, 
     check an order, or book a table. What can I help with?"
    [Buttons: "Browse products" / "Book a table" / "Track an order"]

  Same agent, {agent_first} = false:
    No message sent. Agent waits. Customer opens with whatever they 
    type first, and standard routing (Rule 1, Instructions layer) 
    takes over from there.

### WHY THIS MATTERS

This is a per-client configuration decision, not a per-conversation 
one. Building it as a variable with a sane default means we ship 
agent-first behavior out of the box, but can flip a single value 
to switch to customer-first behavior for any client without 
rebuilding anything else in the agent.

---
---

## RULE 14 — GLOBAL INSTRUCTIONS DOCUMENT STRUCTURE

Global Instructions is not a flat rule dump. Every project's
Global Instructions document follows this exact structure, in
this exact order:

  1. HEADER BLOCK
     Business name · Mode/Archetype · "Applies to all playbooks
     in this project" statement.

  2. THE 12 UNIVERSAL RULES — verbatim, unmodified, numbered 1–12
     These never change in wording across projects. Only the
     business-specific detail embedded inside a rule (e.g. which
     authority limits Rule 4 points to) reflects the project.

  3. ARCHETYPE-SPECIFIC RULES — numbered continuing from 12
     (Rule 13, 14, 15...), pulled directly from that archetype's
     documented escalation triggers and authority limits (per
     Rule 12 of this Standard). These are NOT generic — each one
     traces back to a specific named trigger in the Global Prompt
     or source spec.

  4. ROUTING RULES SECTION
     - Maps customer intent → which playbook activates, with the
       condition that gates it (e.g. "only activate if
       {variable} is set — otherwise route to X first")
     - Escalation override block, marked HIGHEST PRIORITY —
       states that escalation runs in parallel with every turn
       and pre-empts all other playbook activity
     - Default fallback — what happens if no playbook clearly
       matches (always routes somewhere, never left unhandled)

  5. SUMMARY TABLE
     One line per rule number, stating what that rule protects
     (e.g. "Rule 9 → Architecture compliance. Scoring stays in
     n8n."). This is a readability aid for human reviewers, not
     read by the agent.

This structure is mandatory because routing logic and
archetype-specific rules have no other home in the 9-component
architecture — they are not business logic (doesn't belong in
n8n), not identity (doesn't belong in Global Prompt), and not
playbook-local (must be visible on every turn, not just inside
one playbook's scope). Global Instructions is the only component
read by the agent on every single turn, which is why routing and
archetype rules live here.

A Global Instructions document missing any of the 5 sections
above, or that reorders/paraphrases the 12 universal rules, is
incomplete — do not mark it done.

### THE 12 UNIVERSAL RULES (reference — verbatim text lives in each project's own Global Instructions doc)

  1.  KB First, Always — search KB before responding. Never
      answer from memory, training data, or assumption.
  2.  Never Invent Information — KB can't answer → escalate.
      No guessing, no inference.
  3.  Capture Contact Before Conversation Ends — name, email,
      phone, collected one at a time, in that order.
  4.  Respect All Authority Limits — limits from Global Prompt
      are hard stops, not guidelines. Escalate at the limit.
  5.  When Uncertain, Escalate — never guess.
  6.  Human Request = Immediate Escalation — no delay, no
      attempt to resolve first.
  7.  Maintain Context Across All Turns — never re-ask for info
      already given, never lose track of set variables.
  8.  Assemble conversation_summary Before Final Submission —
      must include intent, key facts, outcome. Block the call
      if empty.
  9.  Never Calculate or Modify Lead Score — score/tier/recovery
      profile are READ-ONLY, set only by n8n via tool response.
  10. Never Expose Internal Systems — no mentioning Voiceflow,
      n8n, Airtable, webhook, workflow, tool names, to the
      customer.
  11. Only Answer From Assigned KB — no cross-business KB
      reference, ever.
  12. 2–3 Failed Exchanges = Escalate, Do Not Loop — never a
      4th attempt at the same unresolved issue.

---

## RULE 15 — PLAYBOOK OWNERSHIP (no mid-task re-routing)

Once a playbook activates, it OWNS the conversation until its own
Completion Condition is met — not until the next customer message
"sounds like" it could belong elsewhere.

Do NOT re-evaluate routing on every turn. Re-evaluate ONLY when:
  - The active playbook's Completion Condition has been met, OR
  - An escalation trigger fires (always overrides), OR
  - The active playbook's own Edge Cases explicitly say to hand off

A playbook mid-sequence (e.g. Core Lead Capture mid-collection,
Appointment Assistant mid-booking) must finish its own Sequence
steps even if the customer's next message is a single word that
could superficially match another playbook's LLM Description.
Only the active playbook's defined Next Step triggers a handoff.

---

## RULE 16 — BUTTONS/CAROUSEL MUST SHIP WITH A MESSAGE

Buttons and Carousel steps are NEVER sent alone. Every Buttons or
Carousel step must be preceded by (or paired with) explicit
message text in the same turn — the question or context the
buttons are answering. A button row with no attached question is
incomplete and confuses the customer.

❌ WRONG: [Buttons: "Add it" / "No thanks"] — sent with no text
✅ RIGHT: "Want me to add that personal training session?"
          [Buttons: "Add it" / "No thanks"]

---
## RULE 17 — ACTIVE TASK CONTINUITY (structural, not just instructional)

A "default" or "fallback" playbook must never be treated as the
conversation's home state. Control returning to the orchestrator
between turns is normal Voiceflow behavior — but routing must
check for an in-progress task BEFORE evaluating any playbook
match, including the default.

PRACTICAL BUILD REQUIREMENT:
Wherever a playbook collects multiple sequential fields (Core
Lead Capture: name → email → phone; Appointment Assistant:
date → time → confirm), prefer building it as a single
multi-step exchange (Forms step, or multiple chained Listen
steps within one playbook turn) rather than relying purely on
the orchestrator re-routing back to the same playbook correctly
on every field. Relying on instruction text alone to fight the
default's gravity is fragile — short replies will keep losing to
a named default under ambiguity.

If a multi-field flow must span multiple orchestrator turns
(platform limitation), Active Task Continuity (above) is
mandatory, not optional, in Global Instructions Routing Rules.

--- 
## RULE 18 — API TOOL CONFIGURATION STANDARD

All API tools (Create Lead, Create Conversion, Create Escalation)
follow this exact setup process in Voiceflow. No variations.

---

### NAMING CONVENTION

Input variable names match the field names exactly — no prefixes,
no suffixes, no aliases.

  ✅ CORRECT: variable name = business, body field = business
  ❌ WRONG:   variable name = in_business, body field = business

Same name flows through: project variable → tool input variable
→ body field name → n8n payload field. One name, everywhere.

---

### TOOL SETUP PROCESS (in order)

**1. NAME**
Exact tool name as it appears in playbook routing.
Must match the name referenced in every playbook's Tool Calls
section and LLM Description.
  GlowWell tools: Create Lead · Create Conversion · Create Escalation

**2. TRIGGER / LLM DESCRIPTION**
Tells the agent WHEN to call this tool.
Must be specific — not generic. Include:
  - What condition activates it
  - What must already exist before calling (e.g. lead_id)
  - What it must NOT do (e.g. "never call without exact HH:MM time")

**3. INPUT VARIABLES**
One variable per field being sent to n8n.
For each variable:
  - Name: exact field name (no prefix/suffix)
  - Description: one line — what it contains, where it comes
    from, any constraint (e.g. "format: YYYY-MM-DD")

**4. METHOD + WEBHOOK URL**
  - Method: POST (all three tools)
  - URL: https://n8n-andm.srv1729215.hstgr.cloud/webhook/create-lead (for demo phase: create-conversion/create-escalation)


**5. HEADERS**
Add exactly these two headers to every API tool, no exceptions:

  Content-Type        →  application/json
  x-webhook-secret    →  zm_demo_vf_2026_x7Kp9LmQ2

**6. PARAMETERS**
Leave empty for all three tools.

**7. BODY**
Use Form data format (not URL encoded, not raw JSON) for
Sprint 01 demo builds.

Each row:
  Field name (left)   = the exact field name n8n expects
  Variable (right)    = {variable_name} — same name as input
                        variable, single-brace syntax (Rule 2)

Example row:
  business  →  {business}

Every input variable must have a corresponding body row.
No extra fields. No missing fields.

**8. REQUEST TIMEOUT**
Set to 20 seconds for all three tools.
Do not leave at default (1s) — n8n may need time to process
and respond, especially on first call.

**9. CAPTURE RESPONSE**
NOT configured inside the tool itself.
Configured inside the playbook that calls the tool:
  - Open the playbook
  - Add the tool to the playbook
  - Click the tool → find "Capture response" section
  - Click (+) to add each response field
  - Left field: object path — exact field name as returned by n8n
  - Right field: project variable to save it into

Capture response mappings per tool:

  CREATE LEAD → capture inside Core Lead Capture playbook:
    lead_id          → lead_id
    lead_score       → lead_score
    score_tier       → score_tier
    recovery_profile → recovery_profile

  CREATE CONVERSION → capture inside Appointment Assistant:
    (no variables to capture — success/failure handled by
    graceful degradation logic, not a stored variable)

  CREATE ESCALATION → capture inside Core Escalation Detection:
    escalation_id    → escalation_id

**10. ASYNC EXECUTION**
Leave OFF for all three tools.
Voiceflow waits for n8n response before continuing — required
because Create Lead returns lead_id, lead_score, score_tier,
recovery_profile that the conversation needs immediately.

**11. MESSAGES (Start / Complete / Failed / Delayed)**
Not required for Sprint 01 demo builds.
Leave unconfigured.

---

### KB SEARCH — NOT AN API TOOL

Knowledge Base search is a system tool toggle, not an API tool.
It does not have a webhook, input variables, or body config.

To enable:
  - Open the playbook (or go to Agent-level System Tools)
  - Find "Knowledge Base" in the System Tools panel (right side)
  - Toggle ON
  - Confirm it points to KB_GlowWell — never KB_Ember,
    KB_Precision, or KB_GrowthPath (Global Instructions Rule 11)

LLM Description for KB Search is set in the Knowledge Base
configuration panel, not in an API tool form.

---

### SCOPE

This rule applies to all API tools across all projects
(Ember, GlowWell, Precision, GrowthPath). The process is
identical — only the field names, webhook URLs, and capture
response mappings change per project.

---

## CHECKLIST — APPLY TO EVERY PLAYBOOK BEFORE MARKING IT DONE

  ☐ No workflow dependency — all tool calls written inline (Rule 1)
  ☐ Global prompt & Global instruction are build properly. Also {agent_first} is set.
  ☐ All variables use {single_brace} syntax, no exceptions (Rule 2)
  ☐ Activation / Sequence / Edge Cases / Tool Calls / Completion / 
    Next Step / Nudge — all 7 explicitly defined (Rule 3)
  ☐ followed graceful degradation rule.
  ☐ Tool calls written in exact "After collecting X — call 'Tool' 
    passing X. Store Y." format (Rule 4)
  ☐ Playbook ends with a natural next-step nudge (Rule 5)
  ☐ Buttons/Carousel used wherever a finite choice exists (Rule 6)
  ☐ Date/time logic uses {vf_now} + {vf_user_timezone}, flags past 
    times (Rule 7) — only applies if playbook collects date/time
  ☐ Create Lead called immediately after contact capture, not 
    deferred (Rule 8) — only applies to Core Lead Capture
  ☐ Lead/Conversion state terminology used correctly (Rule 9)
  ☐ LLM Description written for the playbook itself (Rule 10)
  ☐ Every variable touched by this playbook has a description set 
    at the variable level, not just used (Rule 10)
  ☐ Every tool called by this playbook has a trigger description 
    and input parameter descriptions set (Rule 10)
  ☐ KB System Tool (if enabled in this playbook) has its own LLM 
    description (Rule 10)

---

## SCOPE OF APPLICATION

This standard applies to every Voiceflow agent built under the 
Zeromanual AI Builder Protocol:

  - Ember & Co        (Sprint 01)
  - GlowWell Studio   (Sprint 01)
  - Precision Home Services (future sprint)
  - GrowthPath        (future sprint)

Any conflict between this document and the original archetype-level 
specs (Voiceflow Build Sheet, Voiceflow Agent Architecture, n8n 
Workflow Specification) regarding WORKFLOW USAGE is resolved in 
favor of this document. Business logic, variables, escalation 
triggers, and archetype-specific rules from the original specs 
remain fully in force — only the implementation mechanism (workflow 
vs playbook) is overridden.

If a future implementation detail surfaces that is not covered here 
— log it as an Implementation Learning before working around it. 
Do not silently improvise architecture decisions.