# Convocore Agent Intake Checklist (v1)

```
Status:     v1. Built BC-058 (2026-08-14). AUTO rows filled BC-059
            against carmelli.co.uk (2026-08-14).
Purpose:    The single input document for building one real Convocore
            agent + its Zenny backend record, for a demo business built
            by us and shown to that client (not client self-onboarding).
            This is also the seed of onboarding-manual v1 — the same
            document, not a separate draft-then-rebuild pass.
Sources:    Client_Onboarding_Guide.md (archetype diagnostic, workbook
            template — wording reused verbatim where it already works),
            the 3 primary Convocore docs (Agent_Build_Order_Guide_v2,
            Canvas_Ground_Truth_FINAL, Adapter_Spec_FINAL), and a live
            Supabase schema read (2026-08-14) — not the older
            Client_Onboarding_Sequence_Spec.md, flagged stale in
            Wiki/log.md BC-057b entry.
How to use: Give Claude a business website/description. Claude fills
            every AUTO row directly. What's left in the ASK rows is the
            real, short question list to send to the business. Once
            answered, this same filled document is BC-060's build input
            — no second document, no re-derivation.
Columns:    Type = Placeholder (free-text, business-specific answer) or
            Option: [...] (a fixed, real set of choices — never a vague
            "client picks"). Why it matters = one client-facing
            sentence, no internal field names or builder jargon.
```

---

## Before you start: what this checklist does NOT cover

The Convocore node **prompt text itself** — the actual embedded module
logic (Core Agent, Growth Agent, Conversion Engine, etc.) written into
each node's Instructions — is **not a checklist answer**. Per
`Convocore_Agent_Build_Order_Guide_v2.md` Part 6.2's Doc-Search-First
rule, that text is authored at build time (BC-060) directly from
`Agent_Runtime_System_v1.md`'s per-module sections, using the module
list from B1 below to know which sections apply.

`control.agent_prompts` is a separate, unrelated system (Email
Manager's per-client prompt override — BC-058c finding, not wired yet)
— see `Wiki/infra/convocore-agent-provisioning.md`, not relevant to
this checklist.

---

## Filled for: Carmelli Bakery (carmelli.co.uk) — BC-059, 2026-08-14

Fetched: homepage + contact page. About page and a guessed shipping-
policy URL both 404'd — not every AUTO field could be filled; those are
disclosed as still-open below rather than guessed.

## A. Business & Archetype Identity

| # | Question | Why it matters | Type | Source | Answer |
|---|---|---|---|---|---|
| A1 | Business name | The name your customers and your AI assistant will use for your business. | Placeholder | AUTO | **Carmelli Bakery** (Carmelli Kosher Bakery, Golders Green) |
| A2 | What does this business do / primary industry | Sets the general context your assistant works from. | Placeholder | AUTO | Kosher bakery & catering, trading since 1987. Bread, bagels, rolls, croissants, challah, sandwiches, pre-packed and custom cakes, catering platters. |
| A3 | How do customers typically reach you — do they already know exactly what they want, or do they need advice first? | Decides how much your assistant guides vs. simply takes the order. | Option: Urgent problem / Already knows what they want / Needs a booked time slot / Needs advice first / Supports a cause | AUTO | **Already knows what they want** — customers order specific named items (a dozen bagels, a challah, a custom cake) for click-and-collect pickup, no advisory step. |
| A4 | Resulting service style (Emergency / Commerce-Ecom / Commerce-Restaurant / Appointment / Consultation / Engagement) | This is the core behavior mode your AI assistant runs in. | Option: Emergency / Commerce-Ecom / Commerce-Restaurant / Appointment / Consultation / Engagement | AUTO | **Commerce-Ecom** — transactional, click-and-collect, no dine-in/reservation slot, no advisory sales process. |
| A5 | Do you run more than one distinct kind of customer journey (e.g. counter orders AND custom bespoke orders)? | Some businesses need their assistant to handle two different kinds of requests differently — worth confirming so nothing gets missed. | Option: Yes (name the second) / No | AUTO-suggested, confirm | **Suggested: No** — the Online Cake Builder (custom cakes) is still an ordering flow, not a separate service style. Flag if this reading is wrong. |
| A6 | Brand voice / tone | How your assistant should "sound" when talking to your customers. | Placeholder | AUTO-draft, confirm | Warm, welcoming, community/family-bakery feel; emphasizes freshness, in-house baking, and its kosher heritage (Kedassia & KLBD certified). |
| A7 | Agent name | The name shown to customers in the chat widget. | Placeholder (default provided) | AUTO — default convention | **Carmelli Bakery Assistant** (confirm or provide an alternative) |

## B. Convocore Agent Configuration

| # | Question | Why it matters | Type | Source | Answer |
|---|---|---|---|---|---|
| B1 | Which of these should your assistant handle? | Decides what your assistant is actually able to do beyond answering questions. | Option (multi-select): Core Agent (always on) / Growth Agent / Conversion Engine / Recovery Engine / Email Manager | ASK | |
| B2 | Where should customers be able to reach your assistant? | Decides which platforms carry your assistant. | Option (multi-select): Web chat / WhatsApp / Instagram / Messenger / Telegram / Voice (phone) | ASK | |
| B3 | Do you want a phone/voice assistant, not just chat? | Adds a phone-answering capability, with its own setup. | Option: Yes / No | ASK | |
| B4 | Do you want SMS text messaging? | Adds a text-message channel, separate from web chat. | Option: Yes / No | ASK | |
| B5 | Should your assistant follow the standard behavior for this business type, or something more/less proactive? | Controls how much your assistant recommends or upsells vs. staying purely reactive. | Option: Use standard default / Customize (then explain why) | ASK, only if customizing | |
| B6 | How should orders actually get completed — can your assistant place the order directly, or should it hand off? | Decides whether customers can finish an order in the chat itself. | Option: Assistant completes it directly / Assistant guides to your website to finish / Assistant hands off to a person | Depends on D2 — fill once you confirm your ecommerce platform | |
| B7 | What language(s) should your assistant use? | Decides which language(s) customers get replied to in. | Option: Single language (name it) / Automatically match the customer | AUTO, confirm | **English** — site is English-only, no language switcher found. Suggested default: English only. |
| B8 | What are your opening hours (and should your assistant only message during those hours)? | Controls when your assistant sends any proactive messages (never affects live chat replies, which are always available). | Placeholder | ASK — not published on the website | |
| B9 | Who should be notified when your assistant needs to hand a conversation to a real person? | Makes sure a real staff member actually sees escalations, not just the assistant. | Placeholder (name + contact per priority level) | ASK | |
| B10 | *(Emergency businesses only)* After-hours emergency contact | N/A for this business type. | N/A | N/A — A4 is not Emergency | — |
| B11 | If a customer goes quiet mid-order, should your assistant follow up, and on what schedule? | Controls whether/how your assistant nudges an abandoned order. | Option: Use standard default schedule / Customize | ASK, only if B1 includes Recovery Engine | |
| B12 | Product catalogue, pricing, and policies your assistant should know | This becomes your assistant's actual knowledge — what it can answer accurately vs. has to say "let me check." | Placeholder | AUTO-draft, confirm & fill gaps | **Products/pricing found:** bread, bagels (£0.95), rolls, croissants, challah (Baby £1.80 / Medium Kitka £18.00), sandwiches, pre-packed & custom cakes, catering platters (e.g. Mediterranean Platter £58.00). **Policy found:** click-and-collect only, no delivery; bread/bagels/rolls/sandwiches need 24h advance order (next-day cutoff 2pm); croissants, pre-packaged items, and custom cakes need 48h. Kosher-certified (Kedassia, KLBD). **Not found — please provide:** refund/cancellation policy, full current price list, allergen info. |
| B13 | What counts as a "good lead" worth flagging to you? | Only relevant if you want your assistant to flag high-value inquiries (e.g. a large catering order) for personal follow-up. | Placeholder | ASK | |

## C. Backend / Supabase Provisioning

| # | Question | Why it matters | Type | Source | Answer |
|---|---|---|---|---|---|
| C1 | Your business's internal account setup | Purely internal bookkeeping — not something you need to provide. | N/A | AUTO — system-generated | — |
| C2 | Is this a demo build or a live paid account? | Determines your account's internal status. | Option: Demo/internal / Live paid | ASK | |
| C3 | Account status at build time | Internal only. | N/A | AUTO = "onboarding" until go-live | — |
| C4 | Who should be able to log into your dashboard? | Decides who gets a login and what they can see/do there. | Placeholder (name, email, role) | ASK | |
| C5 | Country / locale | Affects date formats, phone number parsing, and defaults. | Placeholder (default suggested) | AUTO, confirm | **United Kingdom** — London address (126-128 Golders Green Road, NW11 8HB). |
| C6 | Should there be a minimum order value that triggers a manual review, or a waitlist for out-of-stock/fully-booked items? | Optional safety net for large or unusual orders. | Option: Yes (set a value) / No | ASK | |

## D. Integration Credentials

| # | Question | Why it matters | Type | Source | Answer |
|---|---|---|---|---|---|
| D1 | Calendar system (for appointment-style bookings) | Not applicable — this business doesn't book time slots. | N/A | N/A — A4 is Commerce-Ecom, not Appointment | — |
| D2 | What platform do you sell/take orders through today (Shopify, WooCommerce, other, or none online yet)? | Decides how your assistant can actually check stock or place orders. | Option: Shopify / WooCommerce / Other / None yet | ASK — **AUTO-suspected, unconfirmed:** the site's URL patterns are consistent with Shopify, but this was not independently confirmed and should not be treated as fact. | |
| D3 | Twilio Account SID + Auth Token + phone number | Needed only if you want a phone assistant (B3). We never invent or guess credentials — you provide these directly. | Placeholder (real credential) | ASK, only if B3 = Yes | |
| D4 | Twilio SMS-capable number | Needed only if you want SMS (B4). Same credential rule as above. | Placeholder (real credential) | ASK, only if B4 = Yes | |
| D5 | Which email inbox should your assistant read/draft from? | Needed only if Email Manager is active (B1). | Placeholder | ASK, only if B1 includes Email Manager. **AUTO-known, for reference:** current published order inbox is `orders@carmelli.co.uk`. | |

---

## Still open after this pass (send to Carmelli)

Everything marked **ASK** above, plus 3 things the website didn't
answer that AUTO couldn't fill: **opening hours** (B8), **refund/
cancellation policy** (part of B12), and **which ecommerce platform is
actually in use** (D2, only a URL-pattern guess so far).

---

## Document Changelog
- **v1** — built BC-058 (2026-08-14). Merges `Client_Onboarding_Guide.md`'s
  archetype diagnostic + workbook fields with the 3 primary Convocore
  docs' genuine business-decision inputs, cross-checked against a live
  Supabase schema read rather than the stale sequence spec.
- **BC-059 (2026-08-14)** — added Type and Why-it-matters columns;
  AUTO rows filled against carmelli.co.uk; archetype diagnostic run
  (result: Commerce-Ecom).
