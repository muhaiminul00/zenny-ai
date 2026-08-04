# ZEROMANUAL — EMBER & CO BUILD GUIDE (Convocore)
## Trial Build — AI Brain Layer Only — Migration Decision Pending

**Scope:** Build Ember & Co agent on Convocore only. GlowWell stays on Voiceflow.
**Unchanged:** n8n workflows, Airtable schema, INTEGRATION_CONTRACT field names, Dashboard.
**Purpose:** Prove Convocore can match Voiceflow build quality before any migration decision.

---

## 1. ARCHITECTURE CONTEXT


CURRENT (production):
Customer → Convocore (Channel Bridge only) → Voiceflow (AI Brain) → n8n → Airtable → Dashboard

THIS TRIAL (Ember only):
Customer → Convocore (Channel Bridge + AI Brain, merged) → n8n → Airtable → Dashboard


One hop removed for Ember specifically. Everything downstream of the AI layer (n8n, Airtable, Dashboard) is identical to the Voiceflow version — this is a brain-swap, not a re-architecture.

Ember stays live on its existing channels during this build. Do not disconnect the current Voiceflow-based Ember agent until this trial is reviewed and approved.

---

## 2. LESSONS CARRIED FROM VOICEFLOW BUILD

The `VOICEFLOW UNIVERSAL BUILD STANDARD.md` exists because GlowWell's build surfaced real implementation errors. Those lessons are platform-agnostic in spirit — they must be re-derived for Convocore's actual mechanics, not copy-pasted blindly. Below is the translation.

| # | Voiceflow Rule (source of the lesson) | Convocore Translation |
|---|---|---|
| 1 | No workflows for business logic — everything inline in Playbook instructions, because Voiceflow Workflows couldn't call tools | Convocore has no such restriction, but keep the same discipline: put routing/logic inline in each Canvas node's instructions, not scattered across disconnected flows |
| 2 | Variable syntax: single `{brace}`, no exceptions | Convocore also uses `{variable}` via the `{` shortcut — enforce the same zero-exception rule across System Prompt, node instructions, and tool parameters |
| 3 | Playbook must be self-contained: Activation, Sequence, Edge Cases, Tool Calls, Completion Condition, Next Step, Nudge | Every Canvas node's Overview/Instructions field must define the same 7 elements. A node missing any of these is not "done" |
| 4 | Exact tool-call phrasing: "After collecting X — call 'Tool' passing X. Store Y." | Same pattern, written into node instructions, referencing exact Convocore tool names |
| 5 | Sales mindset — every response (including FAQ) ends on a soft next-step nudge | Bake into System Prompt persona section AND repeat as a closing instruction in every node |
| 6 / 16 | Buttons/Carousel used liberally to reduce typing friction; never sent without accompanying message text | Convocore UI Engine (buttons/cards/carousel/forms) — same two rules apply. Every UI Engine call must be paired with the question it's answering |
| 7 | Date/time common sense — resolve "today"/"tomorrow" using `{vf_now}` + `{vf_user_timezone}`, catch past-time bookings | **Open gap.** Convocore has no confirmed equivalent to `{vf_now}`. Must inject current date/time as a variable at session start and instruct the model explicitly. Treat as an unproven mechanic — test on Step 1, not Step 3 |
| 8 | Create Lead fires immediately after contact fields are captured, not deferred to conversation end | Identical rule — Create Lead tool call happens in the Core Lead Capture node, immediately after name/email/phone, before routing onward |
| 9 | Lead vs Conversion state discipline — Create Conversion can't fire without a prior `lead_id` | Same — enforce explicitly in every Conversion-adjacent node |
| 10 | Every object (playbook, variable, tool, KB) needs a written description — this is what lets the agent reason in edge cases | Convocore: Tool Description + per-parameter Description (mandatory) + KB description + node instructions. Same discipline, no shortcuts |
| 11 | Graceful degradation — tool/KB failures never expose technical errors to the customer; retry once silently, then degrade gracefully, then escalate | Convocore has no built-in retry/fallback engine — this must be hand-written into node instructions for every tool call, explicitly |
| 12 | Authority limits and escalation triggers live in Global Instructions, not scattered per-playbook | Put as a fixed block in the System Prompt (watch the 10,000-character limit — may need to trim to essentials + reference node-level detail) |
| 14 | Global Instructions has a mandatory 5-part structure: header, 12 universal rules, archetype rules, routing rules, summary table | Reproduce inside the System Prompt as best the character budget allows; anything that doesn't fit moves into node-level instructions instead of being cut |
| 15 | Playbook ownership — once active, a playbook owns the conversation until its Completion Condition is met, not re-evaluated every turn | Use Router Node conditions + Rewind Level setting to hold state and prevent premature re-routing on ambiguous short replies |
| 17 | Multi-field sequential collection (name→email→phone) should be a single structured exchange, not relying on orchestrator re-routing across turns | Use Convocore's Forms UI Engine component for sequential field collection instead of chained Listen-style turns |
| 18 | API tool config standard: exact name, trigger description, input variable descriptions, POST, fixed headers, form-data body, 20s timeout, response capture inside the calling playbook | Convocore Custom Tool (Tools tab → New Tool): Server URL = same n8n webhook, Server Key = same `x-webhook-secret` value, one Parameter per field with Type + Body/Header + Description. Same field names as INTEGRATION_CONTRACT, no renaming |

**Key structural difference to internalize:** Voiceflow's "Playbook" has no 1:1 equivalent in Convocore. The closest match is a **Canvas Node** — use Canvas (not System-Prompt-only) for Ember, because Ember's SOP score (8–9/10) is high and Canvas gives the deterministic, node-level control that a pure conversational prompt would not reliably enforce.

---

## 3. AGENT SETUP

- Create one Convocore Agent: **"Ember & Co"**, single agent covering both Ecommerce and Restaurant modes (mirrors the single Voiceflow project that held both Product Advisor and Dining Advisor).
- Agent → Prompts tab → check **"UI Engine"** (needed for buttons/cards/carousel/forms).
- Agent → Prompt tab → **Lead Scoring & Funnel → leave disabled.** Convocore's native lead-scoring must NOT run — scoring stays exclusively in n8n per the architecture rule ("Voiceflow collects, n8n decides" — same rule now reads "Convocore collects, n8n decides"). Running both would produce two conflicting scores.
- Agent Settings tab:
  - Autostart With Popup → **disabled** (matches `agent_first` default behavior, saves credits)
  - Proactive Message → set a 1-line greeting instead
  - Record Transcripts → **enabled** (needed for QA and the 18-test matrix)
  - AI Introduction Message → must declare AI, per Meta requirements for WhatsApp/IG/FB channels

---

## 4. VARIABLES

Create all in the Variable Drawer. Every variable gets a written description (Rule 10) — not just a name.

**Universal (carried from Voiceflow project variables):**

| Variable | Type | Default | Description |
|---|---|---|---|
| business | String | "Ember & Co" | Fixed at agent level |
| archetype | String | "Commerce" | Fixed at agent level |
| customer_name | String | — | Set by Core Lead Capture |
| customer_email | String | — | Set by Core Lead Capture |
| customer_phone | String | — | Set by Core Lead Capture |
| source_channel | String | — | Set from channel metadata at session start |
| intent | String | — | Set by Router Node on first classification |
| lead_id | String | — | Returned by Create Lead. Required before any Create Conversion call |
| lead_score | Number | 0 | READ-ONLY after set. Returned by n8n. Ember doesn't gate on this (GrowthPath does) but still must be passed through |
| score_tier | String | — | READ-ONLY. Returned by n8n |
| recovery_profile | String | — | READ-ONLY. Returned by n8n. Should return "Commerce" for Ember |
| lead_status | String | "New" | New / Qualified / Converted / Escalated |
| escalation_flag | Boolean | false | Set true by Core Escalation Detection. Triggers Create Escalation + Live-Handoff |
| conversation_summary | String | — | Assembled before Create Lead / Create Conversion / Create Escalation calls. Must include intent, key facts, outcome |
| agent_first | Boolean | true | Controls whether agent greets first. Set at agent config level, not mid-conversation |

**Ember-specific:**

| Variable | Type | Default | Description |
|---|---|---|---|
| product_interest | String | — | Set by Product Advisor node |
| order_number | String | — | Used for order-status KB/tool lookups |
| cart_value | Number | 0 | Running cart total. Checked against 3× AOV threshold before Purchase Assistant activates |
| party_size | Number | 0 | Set by Dining Advisor. ≥10 triggers escalation |
| reservation_date | String | — | Set by Dining Advisor. Format YYYY-MM-DD |
| reservation_request | String | — | Full assembled reservation detail before Create Conversion call |
| current_datetime | String | — | **New — not in original Voiceflow spec.** Injected at session start to cover the `{vf_now}` gap. Format ISO 8601, customer-local if determinable |

---

## 5. KNOWLEDGE BASE

One KB for the agent — **KB_Ember**, same as Voiceflow (Convocore filters by intent context rather than separate KB tables, so no structural change needed here).

Upload/scrape:
- Products (target: 15 for demo parity)
- Shipping, Returns, Sizing, Materials, Order Tracking
- Policies, Promotions
- Restaurant: Menu, Hours, Reservations, Dietary Options
- FAQs (target: 10)

KB Description (per Rule 10, set in Convocore's KB config panel):
> "Use this to answer any customer question about Ember & Co products, shipping, returns, sizing, materials, order tracking, policies, promotions, menu, hours, reservations, or dietary information. Never answer from memory — if the KB has no confident match, escalate."

---

## 6. TOOLS

Do not modify the two Convocore default tools (**KB-Search**, **Live-Handoff**) — used as-is for FAQ retrieval and human handoff respectively.

Build 3 Custom Tools (Tools tab → New Tool → Create custom tool). Same webhook URLs, same field names, same header secret as the Voiceflow build — zero changes to the n8n side or INTEGRATION_CONTRACT.

### Tool 1 — Create Lead
| Setting | Value |
|---|---|
| Server URL | `https://n8n-andm.srv1729215.hstgr.cloud/webhook/create-lead` |
| Server Key (header) | `x-webhook-secret: zm_demo_vf_2026_x7Kp9LmQ2` |
| Description | "Send lead data to n8n after contact info is captured. Call immediately after customer_name, customer_email, customer_phone are all collected — do not defer to conversation end." |

Parameters (Body):

| Key | Type | Description |
|---|---|---|
| business | String | Always "Ember & Co" |
| customer_name | String | From customer_name variable |
| customer_email | String | From customer_email variable |
| customer_phone | String | From customer_phone variable |
| source_channel | String | From source_channel variable |
| intent | String | Current classified intent |
| conversation_summary | String | Full summary of conversation up to this point |

Capture response into variables: `lead_id`, `lead_score`, `score_tier`, `recovery_profile`.

### Tool 2 — Create Conversion
| Setting | Value |
|---|---|
| Server URL | `https://n8n-andm.srv1729215.hstgr.cloud/webhook/create-conversion` |
| Server Key (header) | same as above |
| Description | "Call when customer confirms a purchase or reservation AND lead_id already exists AND (for Purchase) cart_value has passed the AOV gate. Never call without a prior lead_id." |

Parameters (Body) — shared: `lead_id`, `business`, `conversion_type` ("Purchase" or "Reservation")
Plus, conditionally:
- Purchase: `product_interest`, `cart_value`
- Reservation: `party_size`, `reservation_date`

No response fields need capturing — success/failure handled by graceful degradation logic in the node, not a stored variable (same as Voiceflow spec).

### Tool 3 — Create Escalation
| Setting | Value |
|---|---|
| Server URL | `https://n8n-andm.srv1729215.hstgr.cloud/webhook/create-escalation` |
| Server Key (header) | same as above |
| Description | "Call the moment escalation_flag is set true, from any node. Overrides all other in-progress tasks." |

Parameters (Body): `business`, `escalation_reason`, `priority`, `lead_id` (if available), `conversation_summary`

Capture response into: `escalation_id`

**Timeout:** set to 20s on all three (same rationale as Voiceflow — n8n needs processing time, don't leave at any short default).

---

## 7. CANVAS STRUCTURE


Start Node
  — Greet (if agent_first = true), detect Ecom vs Restaurant mode
  — Inject current_datetime variable
      ↓
Router Node
  ├── Core FAQ
  ├── Core Lead Capture
  ├── Product Advisor          (Ecom)
  ├── Dining Advisor           (Restaurant)
  ├── Purchase Assistant       (Ecom conversion)
  ├── Reservation Assistant    (Restaurant conversion)
  └── Core Escalation Detection (parallel / global — can pre-empt any node)


### Node specs (each must define all 7 elements per Rule 3)

**Core FAQ**
- Activation: any product/shipping/return/menu/policy question
- Sequence: KB-Search → answer → nudge
- Edge cases: KB miss → escalate, never invent
- Tool calls: KB-Search (built-in)
- Completion: answer delivered or escalation fired
- Next step: return to Router
- Nudge: "While you're here — were you looking for something specific?"

**Core Lead Capture**
- Activation: customer expresses purchase/reservation intent without contact info on file
- Sequence: Forms component — name → email → phone in one structured exchange
- Edge cases: customer refuses a field → note it, escalate if all 3 can't be captured after 2 attempts
- Tool calls: immediately after all 3 fields set → call Create Lead → store lead_id, lead_score, score_tier, recovery_profile
- Completion: lead_id returned
- Next step: return to whichever node was waiting (Product Advisor / Dining Advisor)
- Nudge: n/a (transactional node)

**Product Advisor** (Agentic 3/10, SOP 8/10)
- Activation: Ecom mode, product question or browsing intent
- Sequence: 1-2 clarifying questions max → confident recommendation → bundle suggestion on selection
- Edge cases: no suitable product after 2 recommendations → escalate
- Tool calls: KB-Search for product facts
- Completion: product selected, cart_value set
- Next step: Purchase Assistant (check cart_value gate first)
- Nudge: built into bundle suggestion — "Customers who added [X] also pair it with [Y]"

**Dining Advisor** (Agentic 2/10, SOP 9/10)
- Activation: Restaurant mode, reservation intent
- Sequence: collect party_size, reservation_date, dining_preferences — near-scripted
- Edge cases: party_size ≥10 → escalate immediately, do not attempt to book
- Tool calls: KB-Search for menu/dietary questions
- Completion: all 3 fields set, party_size <10
- Next step: Reservation Assistant
- Nudge: minimal — speed over conversation

**Purchase Assistant**
- Activation: purchase intent confirmed, lead_id exists
- Sequence: check cart_value ≥ 3×AOV → if yes, escalate, do not auto-complete; if no, call Create Conversion
- Edge cases: tool failure → graceful degradation (Section 8)
- Tool calls: Create Conversion (conversion_type = "Purchase")
- Completion: conversion confirmed or escalated
- Next step: end or Core FAQ (further questions)
- Nudge: confirm + offer receipt/tracking info

**Reservation Assistant**
- Activation: reservation intent confirmed, lead_id exists, party_size <10
- Sequence: confirm date/time using current_datetime (flag past times per Rule 7 translation) → call Create Conversion
- Edge cases: requested time already passed → flag naturally, ask for correction
- Tool calls: Create Conversion (conversion_type = "Reservation")
- Completion: conversion confirmed or escalated
- Next step: end
- Nudge: confirm details, offer directions/parking info if in KB

**Core Escalation Detection** (parallel/global — overrides everything)
- Triggers (8, same as Voiceflow spec): refund dispute, damaged product claim, chargeback discussion, cart_value ≥3×AOV, party_size ≥10, pricing exception/discount request, legal or guarantee question, 2-3 failed exchanges on same issue
- On detection: set escalation_flag = true, escalation_reason, call Create Escalation, trigger Live-Handoff
- Override rule: no other node continues once escalation_flag = true

---

## 8. GRACEFUL DEGRADATION (write into every tool-calling node — no engine does this automatically)

- Tool call fails/times out → retry once, silently, no message shown during retry
- Retry also fails → never expose technical language; say something natural ("Let me just get this confirmed for you — one moment"), then close gracefully ("I've got your details — our team will reach out shortly")
- Treat repeated failure as escalation-worthy: set escalation_flag = true, escalation_reason = "Tool call failed after retry", attempt Create Escalation once
- If Create Escalation also fails → do not loop; end conversation gracefully without blocking the customer

---

## 9. UI ENGINE USAGE (buttons / cards / carousel / forms)

- Carousel: multiple product recommendations, multiple menu items
- Buttons: confirm/change, 2-4 named options, quick qualifying replies ("Casual"/"Formal"), closing a recommendation ("Add to order"/"Show alternatives")
- Forms: Core Lead Capture (name/email/phone in one structured block)
- Rule: never send a button/card/carousel block without accompanying message text in the same turn
- Note: UI Engine increases credit consumption — monitor Usage tab during testing, factor into the cost comparison this trial is partly meant to inform

---

## 10. BUILD SEQUENCE

**Step 1 — Skeleton**
- Create Agent, all variables, KB upload (Products/Shipping/Returns/Sizing/Materials/Order Tracking/Policies/Promotions/Menu/Hours/Reservations/Dietary)
- Build all 3 Custom Tools, test each individually with Preview LLM
- Build Start Node + Router Node only, no downstream logic yet
- **Test current_datetime injection immediately** — this is the least-proven mechanic, don't leave it to the end

**Step 2 — Node logic**
- Build Core FAQ, Core Lead Capture (Forms), Core Escalation Detection
- Build Product Advisor (bundle behavior) + Purchase Assistant (AOV gate)
- Build Dining Advisor (party_size gate) + Reservation Assistant (date/time handling)
- Apply Rule 3 + Rule 10 discipline to every node before marking it done — no node ships without all 7 elements and all descriptions written

**Step 3 — Integration + test**
- Connect tools to live n8n webhooks, verify lead_id/lead_score/score_tier/recovery_profile write back correctly
- Run Ember-relevant subset of the 18-test Voiceflow matrix:

| Test | Input | Expected |
|---|---|---|
| T-01 | Ask a question that exists in KB | Correct KB answer, no invention |
| T-02 | Ask a question not in KB | escalation_flag = true, Create Escalation fires |
| T-03 | Express intent without contact info | Name/Email/Phone collected via Form, all 3 populated |
| T-04 | "I want a refund" | Immediate escalation, Airtable record + Slack alert |
| T-05 | "Can I get a discount?" | Escalate, no negotiation |
| T-06 | "Can you guarantee results?" | Escalate, no guarantee made |
| T-07 | Same unresolved exchange 3× | Escalate on 3rd attempt, no infinite loop |
| T-08 | Add one product to cart | Complementary product suggested, cart_value updated |
| T-09 | Set cart_value to 4× AOV before purchase | Escalate, purchase not auto-completed |
| T-Ember-10 (new) | Request table for 12 people | Escalate immediately, no booking attempt |
| T-Ember-11 (new) | Request "today at [time already passed]" | Agent flags the passed time, asks for correction |

- Log any new implementation issue encountered as a learning — start a `CONVOCORE_BUILD_STANDARD.md` mirroring the Voiceflow one, rather than silently working around problems

---

## 11. OPEN RISKS TO VALIDATE

- No confirmed native equivalent to `{vf_now}` / `{vf_user_timezone}` — current_datetime injection is unproven, test first
- No built-in retry/graceful-degradation engine — entirely hand-written, higher chance of inconsistent behavior across nodes if not carefully standardized
- System Prompt 10,000-character cap may not fit the full Global Instructions 12-rule + archetype block — some logic may need to live at node level instead, which changes where "the agent" reads it (every turn vs only when that node is active)
- Rewind Level tuning (Canvas node setting) is unproven for holding conversation state across multi-turn field collection — direct analog to Voiceflow's Active Task Continuity problem (Rule 17), same risk class, different mechanism
- UI Engine is explicitly marked "experimental" by Convocore — test thoroughly, don't assume production stability
- Credit cost of UI Engine + RAG + tool calls not yet benchmarked against Voiceflow's per-conversation cost — collect this data during testing since cost was the original motivation for this trial

---

## 12. DECISION GATE

After Step 3 testing, compare against GlowWell/Ember Voiceflow baseline on:
- All test pass/fail parity
- Escalation accuracy (no false positives/negatives on the 8 triggers)
- Conversation quality/tone (bundle suggestion, nudges feel natural, not scripted)
- Cost per conversation (credits vs Voiceflow token cost)
- Build/maintenance effort (how much of Rule 1-18 discipline had to be manually re-implemented vs Voiceflow enforcing it structurally)

No migration decision is made until this comparison is reviewed.
