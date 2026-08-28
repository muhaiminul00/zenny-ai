# Zenny — Raw Product Definition (v1)

```
Status:   Foundational reference — the "what we're building" statement,
          written before any implementation vocabulary (no "modules",
          "archetypes", or current-stack names below by design).
Purpose:  Shared starting point for the own-infra (SaaS/Micro-SaaS)
          planning effort — read this before structuring HOW to build.
Trigger:  Current stack's pricing structure (Convocore, specifically)
          made owning the infra worth real evaluation. See
          `Zenny_Own_Conversation_Runtime_Outline_v1.md` (companion doc,
          already-drafted roadmap for the how) and
          `Wiki/reference/convocore-pricing-live-facts.md` (the cost
          finding that triggered this).
Scope:    Describes the product, not the build plan. No sequencing, no
          budget, no tech choices here — that's the next document.
```

---

## One-sentence definition

An AI agent that businesses hire to do the job of a customer support +
sales + ops rep — talks to their customers wherever those customers
already are, and actually completes the tasks a human rep would, not
just chats.

---

## 1. Where it talks to people (channels)

- Website live chat
- Social media DMs (Instagram, Facebook, WhatsApp)
- Email
- (Later) Phone/voice

---

## 2. What it can do *for the customer*, in conversation

### Answering / informing
- Answer FAQs (hours, policies, "where's my order," "how does X work")
- Recommend products/services based on what the customer says they need
- Explain pricing, availability, options

### Getting things done (the agent actually acts, not just talks)
- Book an appointment
- Reschedule an appointment
- Cancel an appointment
- Check appointment status/upcoming bookings
- Place an order (fully automatic where possible, or "prepare it and
  hand to a human to confirm" where the business isn't set up for full
  automation yet)
- Track an order (status, shipping, delivery)
- Update an order (change item, cancel, refund request)
- Open a support ticket when it can't resolve something itself
- Update a ticket / tell the customer its status
- Escalate to a real human when it's stuck, when the customer asks for
  one, or when the situation is sensitive (complaint, refund dispute,
  etc.)

---

## 3. What it does *for the business owner* (the paying customer)

### Follow-up / recovery
- If a lead goes cold (asked about something, never bought/booked),
  automatically follow up on a schedule until they respond or a cutoff
  is hit — recovers business that would otherwise just be lost

### Inbox handling
- Read the business's own inbox
- Sort/categorize incoming email (support vs. sales vs. spam vs. urgent)
- Draft replies using what it knows about the business
- Send replies (or queue them for owner approval, depending on how much
  trust the owner wants to give it)

### Visibility
- A dashboard where the owner can see: conversations, appointments,
  orders, open tickets, leads in follow-up, and turn features on/off

---

## 4. Underlying qualities this needs to actually work

Not features — requirements the whole thing depends on regardless of
how it's built:

- **Memory** — it needs to remember the conversation and the customer's
  history, not start blank every message
- **Knowledge** — it needs to actually know the business's real info
  (products, hours, policies) — this has to come from somewhere and
  stay current
- **Judgment on when to stop** — knowing when it's out of its depth and
  should hand off to a human, instead of guessing or stalling
- **Reliability** — if it says it booked something, it actually has to
  be booked; a "smart-sounding" reply that didn't actually do the thing
  is worse than no automation
- **One system, many businesses** — this isn't built once per business;
  it's one platform that many separate businesses use, each with their
  own data kept separate from the others'
- **Different businesses need different subsets of this** — a bakery
  doesn't need "appointment booking," a dentist doesn't need "order
  tracking" — so the system needs to flex per business, not force every
  capability on everyone

---

## Document Changelog
- **v1 (2026-08-25)** — first raw-idea definition, written pre-jargon at
  the human's explicit request as the starting reference for the
  own-infra planning effort. Deliberately excludes any current-stack or
  implementation vocabulary.
