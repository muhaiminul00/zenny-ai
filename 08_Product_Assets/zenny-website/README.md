# Zenny Website — README

Reference doc for future edits. Explains what's on the page, why each section exists, why it's ordered the way it is, and what decisions were deliberately made (so nobody "fixes" something that was already fixed once).

Single HTML file (`index.html`), no build step, no framework. Vanilla CSS + JS throughout.

---

## Positioning — the core idea everything else follows from

Zenny is sold as an **AI workforce**, not a chatbot. That distinction drives every section on the page:

- A chatbot answers questions. A workforce **responds, converts, recovers, manages, and reports** — full customer lifecycle, not just Q&A.
- A generic chatbot sounds the same everywhere. Zenny **behaves differently per business type** — dispatcher for emergency services, sales advisor for ecommerce, front desk advisor for appointments, senior consultant for agencies. This is the single strongest trust/differentiation lever on the site and shows up concretely in the How It Works section.

If a future edit drifts back toward generic "AI chatbot" language or generic capability lists (FAQ automation, order tracking, etc. as standalone claims), that's a regression — the whole rebuild moved away from that framing on purpose. See "Rejected ideas" below for why.

---

## Section-by-section order and rationale

Final order, top to bottom:

| # | Section | id | Why it's here / why this position |
|---|---|---|---|
| 1 | Hero | `#hero` | Hook. Outcome-led headline ("Capture more revenue with an AI workforce"), not a feature headline. Includes a calm urgency line, not aggressive fear-based copy (see Rejected ideas). |
| 2 | About / "What is Zenny?" | `#meet-zenny` | One paragraph explaining the core concept before anything else is asked of the visitor. |
| 3 | Agents section ("Not another chatbot") | `#features` | The consolidated workforce breakdown. See "Agents section" below — this used to be two separate near-duplicate sections and was merged into one. |
| 4 | How It Works (archetype tabs) | `#how` | **Strongest section on the page.** Real conversation examples per industry, proves the "behaves differently per business" claim instead of just stating it. Deliberately moved up from its original lower position — proof should come early, not be buried mid-page. |
| 5 | Getting Started | `#getting-started` | Removes the "sounds complicated to set up" objection while the visitor is still warm from seeing it work. This is the *original* "How It Works" content (4-step onboarding) — it got renamed because "How It Works" now means the archetype/conversation section, and this is really about onboarding ease. |
| 6 | Stats band | `#impact` | Quick proof numbers (response time, uptime, etc.) right after Getting Started, reinforcing "this actually works" before the pricing conversation starts. |
| 7 | Pricing | `#pricing` | Deliberately **not** first and **not** last. Placed after enough trust-building (agents → proof → ease → stats) that a visitor has reason to believe the price is justified, but not so late (end of a long page) that most visitors never scroll far enough to see it. See "Pricing" section below for layout rationale. |
| 8 | Platforms | `#platforms` | Reach/flexibility — channels supported. Comes after pricing since it's reinforcing, not persuading. |
| 9 | Testimonials | `#testimonials` | **Currently toggleable off** — see "Testimonials" section below, important. |
| 10 | Final CTA | `#book-demo` | Ask. Includes a risk-reversal line, not aggressive sales language. |

---

## Agents section — why it looks the way it does

This went through the most iteration on the page. History, so nobody redoes the same mistake:

1. **Original state:** generic feature cards (FAQ automation, order tracking, call automation, etc.) — read like a commodity chatbot feature list, no differentiation.
2. **First rebuild:** split into two sections — a 4-card "agent" section (Revenue Agent, Conversion Agent, Recovery Agent, Booking Agent) and a separate 5-card "Not another chatbot" section (Respond, Convert, Recover, Manage, Report). These were **~80% conceptually identical**, just worded differently (Revenue Agent ≈ Respond, Conversion Agent ≈ Convert, Recovery Agent ≈ Recover). Confirmed via direct copy comparison, not just a hunch.
3. **Interim attempt:** replaced the 4-card agent section with different content (Trained on your brand / Every channel, one agent / Knows when to hand off / Built differently per industry) to remove the overlap. This worked structurally (no more duplication) but felt abstract and less confident than the original named-agent framing.
4. **Final state (current):** consolidated into **one section**. The 5-card "Not another chatbot" section kept its existing structure and copy, but each card now leads with an agent name:
   - **Revenue Agent** — Respond
   - **Conversion Agent** — Convert
   - **Recovery Agent** — Recover
   - **Inbox Agent** — Manage
   - **Insight Agent** — Report

   This keeps the concrete, named-product feel that worked, without a second section restating the same ground. **Do not re-split this into two sections** unless the content is genuinely different — that's the mistake that got fixed twice already.

The old standalone "Built around your business" section was deleted entirely, including its CSS (`.features`, `.features-grid`, `.feature-card` and variants). Its `id="features"` was moved onto this consolidated section so the nav "Features" link and the CTA band's "Learn more" link kept working.

---

## How It Works — archetype tabs

Interactive component: pill-style tab menu (4 archetypes) + a single-center-card carousel showing 3 conversation scenarios per archetype, with the other two scenarios peeking in blurred on either side.

**Archetypes and personas (fixed — these map to the actual product's behavior, not arbitrary marketing categories):**
- Emergency Services → **Dispatcher** persona. Fast, calm, structured.
- Ecommerce & Restaurant → **Sales Advisor** persona. Warm, confident, closes without pressure.
- Appointments (Gym/Spa/Salon) → **Front Desk Advisor** persona. Efficient, friendly.
- Consulting & Agency → **Senior Consultant** persona. Curious, qualifies before pitching.

**Design rules for this component, if adding/editing scenarios:**
- Exactly 3 scenarios per archetype, each a **genuinely different pain point** — not 3 versions of the same situation. (E.g. Emergency's 3 are: after-hours panic call, price-shopping researcher, angry follow-up customer — different situations, not variations.)
- Every line of dialogue must sound like an actual employee in that role talking, never like an AI describing its own capabilities. Rewrite anything that reads like "I can answer, book, follow up, and route" — that's a feature list wearing a chat bubble, not a person talking.
- Each scenario has a short 1-line summary caption below it, written from **the agent's perspective** (what Zenny is doing/deciding), not customer-facing copy.
- Tabs: solid active-color highlight (no gradient — a gradient tab state was explicitly removed per design direction), inactive tabs dimmed via opacity.
- Carousel: only one scenario fully visible/legible at a time; loops continuously through all 3, no dead-end at position 3.

---

## Pricing — why it's structured this way

**Original problem:** pricing cards were enormous (~650-750px tall each) — full sentence-length feature lists, a scoped list, a footer checklist. Section totaled 2,000+px, the longest on the page.

**Current structure:** compact 2-column cards (price/CTA on one side, condensed 5-6 item highlight list on the other) plus a **separate, denser comparison table** below for the full feature breakdown. The table is collapsed behind a "See full feature comparison" toggle by default.

**Important distinction — don't collapse the cards themselves.** The original pricing complaint was information hidden behind a toggle with nothing substantial visible without clicking. The fix keeps the cards fully open (price, pitch, and real inclusions visible with zero clicks) and only collapses the *supplementary* detail table. If a future edit is tempted to put more content behind toggles to save space, the cards are the one thing that should never go behind a click.

**Known content notes:**
- Hidden Starter/Growth/Scale tier markup exists in the file, commented out. Left intentionally — not live, not deleted. If reintroducing these tiers, they'll need the same compact-card treatment as the two live tiers, not the old sentence-list style.
- The dead billing-toggle JS (`#billingToggle` IIFE) was removed — it was a no-op referencing markup that no longer exists in the live DOM.
- A data error was caught and fixed: Full Deployment's channel claim was incorrectly listed as "WhatsApp OR Instagram" (an either/or) when it should state full/all-channel access. If editing pricing copy, **double check every specific claim against what's actually true** — this kind of error is a trust killer if it ships.

---

## Testimonials — currently hidden, read this before touching

The Testimonials section is **built and staying in the code**, but toggled off from rendering. As of this rebuild, there were no confirmed-real customer testimonials — rather than ship placeholder/unverified quotes (a trust risk on a page whose entire pitch is "trust us"), the section was kept in the markup with an easy on/off switch (class or comment-based toggle — check the section for the specific mechanism used) so it can be turned on the moment real testimonials are ready.

**The floating navigator automatically hides its "Trusted By" dot if this section is hidden** — this was built deliberately so re-enabling/disabling Testimonials doesn't leave a dead nav dot pointing at nothing. If Testimonials content changes, verify this auto-hide logic still works.

**Do not populate this section with fabricated quotes, logos, or client names.** When real testimonials exist, replace the placeholder content and flip the toggle on.

---

## Floating section navigator

Fixed vertical nav on the right side (desktop only), dots mapped to all 10 page sections via IntersectionObserver.

**Labels (deliberately not literal section names — psychological/sales-journey framing):**

| Label | Maps to |
|---|---|
| The Hook | Hero |
| Meet Zenny | About |
| Meet the Agents | Agents section |
| Real Conversations | How It Works |
| Easy Setup | Getting Started |
| Proven Results | Stats band |
| Pricing | Pricing |
| Every Channel | Platforms |
| Trusted By | Testimonials (auto-hidden if section is hidden) |
| Book a Demo | Final CTA |

**If sections are added, removed, or reordered, this navigator must be updated to match** — it was rebuilt once already after a reorder broke its section mapping. Don't let it go stale again: whoever changes page structure owns updating this table and the underlying IntersectionObserver config.

Design constraints: vanilla JS only (no libraries), generous hover/click hit area around each dot (not just the visible dot size — this was a specific bug fix, don't shrink it back down), subtle animation only, matches existing dark/purple/amber theme.

---

## Hard constraints — apply to any future edit

- **Single HTML file.** No framework, no build step, no external animation libraries.
- **No new fonts, no new color tokens.** Existing CSS variables only.
- **Don't touch booking/embed code** (Cal.com `data-cal-*` attributes, Calendly script/init) unless the task is specifically about the booking flow. Both embed systems exist in the file simultaneously and were preserved as-is throughout the rebuild — this was intentional, not an oversight.
- **Logo:** `zenny_logo.png`, lives in the site root (not an `img/` subfolder — this was a real bug that got fixed; don't reintroduce a path prefix that doesn't match where the file actually lives).
- **Platform icons** (WhatsApp, Messenger, Instagram, Slack, Email): inline SVG, not image files. The actual icon image files (whatsapp_icon.png etc.) never existed — they were broken references from the start. Icons were rebuilt as inline outline SVGs matching the site's existing stroke-based icon style. Don't reintroduce `<img>` tags for these — either reuse the existing inline SVG markup or add new inline SVGs in the same style.
- **We do not currently offer call/voice automation.** "Call Automation" was deliberately removed from both Features and Platforms. Don't add it back without confirming the product actually supports it.

---

## Rejected ideas (and why), so they don't get re-proposed

- **Aggressive/fear-based problem statement** ("You're losing customers every day") — rejected as too aggressive without proof, replaced with a calmer framing ("Customers don't wait. The fastest response usually wins.").
- **"AI employee" as the core differentiator** — rejected as too generic; many competitors use this exact phrase. The real differentiation is outcome ownership + industry-specific behavior + connected systems, not the employee metaphor alone.
- **A second "raw capability list" section** (FAQ automation, order management, social media replies, email marketing automation, call automation) proposed as a callback to an earlier draft — rejected. Nearly every item either duplicated the Agents section (FAQ & support automation ≈ Revenue Agent) or something already shown elsewhere (social replies ≈ Platforms section), or wasn't something actually offered (call automation). One claim (email marketing automation — "campaigns," "welcome sequences," "re-engagement flows") is a bigger claim than reactive email handling; if this idea resurfaces, verify that specific claim against reality before shipping it.
- **Two adjacent sections both breaking down "the agents"** (literal merge of the old 4-agent section directly above the 5-job section) — rejected, see "Agents section" above for the full reasoning.
- **Hiding the pricing cards' own feature list behind a toggle** — rejected, see "Pricing" above. Only the supplementary comparison table collapses, never the cards themselves.

---

## Open items / things to revisit

- **Testimonials** — need real, verified customer quotes before this section goes live. Currently hidden.
- **Claim accuracy pass** — a full read-through of every specific stat/number on the page (stats band figures, guarantee language, comparison table numbers) against actual current truth is worth doing periodically, especially after any copy edit — one wrong claim (like the channels bug that got caught) undermines the trust the whole site is built to establish.
- **Hidden pricing tiers** (Starter/Growth/Scale, commented out) — not in use; revisit only if there's a real product/pricing decision to introduce more tiers.
