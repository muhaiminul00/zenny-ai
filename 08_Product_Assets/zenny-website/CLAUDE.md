# ZENNY WEBSITE REBUILD — CLAUDE.md v2

## ROLE
Senior frontend engineer. Rebuild positioning/structure of Zenny website (single HTML file).
NOT touching AI system, backend, integrations.

## STATUS
v1 partially done. Keep what worked, fix what didn't.

**Already done — keep as-is:**
- Hero rewrite ("AI workforce" positioning, badge, proof row)
- "Not another chatbot" workforce section (Respond/Convert/Recover/Manage/Report cards)
- Pricing copy updates

**Not done / broken — fix now:**
- How It Works section — still old version, untouched. This is the main task below.
- "Call Automation" still present in Features and Platforms — remove both.
- Hero chat bubble line and any example chat copy reads too AI-ish — needs human tone rewrite.

## PRODUCT TRUTH
Zenny = AI workforce, not chatbot. Behavior changes per business type:
- Emergency (plumber/roofer/electrician) → Dispatcher. Fast, structured, minimal talk.
- Ecommerce/Restaurant → Sales Advisor. Recommends, reassures, closes.
- Gym/Spa/Salon → Front Desk Advisor. Books, informs, follows up.
- Consulting/Agency → Senior Consultant. Explores situation, qualifies, hands off.

## HARD CONSTRAINTS
DO NOT:
- touch backend logic, integrations, Calendly/Cal.com embeds, chatbot functionality
- add JS/CSS frameworks or external animation libraries
- add fonts or change color tokens
- make it flashy/glassmorphism/gradient-overload

KEEP:
- single HTML file
- existing CSS variables, class structure, typography
- dark/purple/amber theme
- professional, premium, reliable tone
- `img/zenny_logo.png` as the logo, already wired in nav + footer — don't change the path or swap logos

## TASK 1 — REBUILD "HOW IT WORKS" (primary task)

Replace the current static "How It Works" content with a new interactive section. Do not delete the existing 4-step onboarding + training card block — see Task 3, it moves and gets renamed, it does not get deleted.

**Structure of new section:**

1. Short attractor copy above the component. Not generic ("see how it works") — make it curiosity-driven, e.g. framing that different businesses need different conversations, and inviting the visitor to see their own type in action. Write 1-2 sentences, not a paragraph.

2. A pill-style horizontal menu bar (gradient-highlighted active state, existing purple/amber tokens only) with 4 options:
   - Appointments (Gym, Spa, Salon)
   - Emergency Services (Plumber, Roofer, Electrician)
   - Ecommerce & Restaurant
   - Consulting & Agency

3. Clicking a pill (or using a slide arrow control) reveals that archetype's content: persona name + one-line framing, then 3 example conversations for that archetype — not 1.

4. The 3 example chats sit in a horizontal-scroll row (swipeable/scrollable, arrows optional for desktop). Each chat card uses existing `.bubble-agent` / `.bubble-user` styling. Keep each conversation short — 3-5 message bubbles max.

5. Each of the 3 scenarios per archetype should be a distinct, common, relatable pain point for that business type — something the business owner reading it recognizes from their own daily reality, followed by Zenny handling it smoothly. Do not reuse the same scenario shape across the 3 — vary the pain point (e.g. for Emergency: after-hours panic call, price-shopping researcher, angry follow-up customer — three different situations, not three versions of the same one).

**Conversation tone — critical:**
Write every line like a skilled human employee actually talking, not like a machine describing its own capabilities. Avoid phrases like "I can answer, book, follow up, and route" — that's a feature list wearing a chat bubble. A dispatcher sounds calm and direct. A sales advisor sounds warm and confident. A front desk advisor sounds efficient and friendly. A consultant sounds curious and sharp. None of them should sound like an AI describing itself.

Draft example scenarios for each archetype before finalizing — I want to review the actual conversation copy before it's locked in.

**Animation:** CSS/JS only, no libraries. Subtle transition when switching pills/tabs, native horizontal scroll (or simple JS-driven scroll snap) for the 3 chat cards. Keep it light — this is a professional B2B site, not a showcase.

## TASK 2 — REMOVE CALL AUTOMATION

We are not offering call/voice automation right now.
- Remove the "Call automation" card from the Features section entirely.
- Remove the "Call Automation" card from the Platforms grid entirely.
- Don't leave gaps in the grid — let it reflow naturally, or if you want to fill the Platforms slot, suggest one alternative (e.g. SMS, Telegram, Google Business Messages) and ask before adding — don't invent a new platform claim without confirmation.

## TASK 3 — RENAME + RELOCATE EXISTING ONBOARDING BLOCK

The current "How It Works" content (4-step onboarding: Tell us about your brand → We train Zenny → Choose channels → Go live, plus the training visual card) is good content — it explains ease of onboarding, not customer experience. Keep it, but:
- Rename the section heading/label so it's clearly about setup/onboarding, not "how it works" (that name now belongs to the new archetype section). Suggested direction: something like "Getting Started" / "From Sign-up to Live" / "Setup, Handled for You" — pick whichever reads cleanest with existing copy, or propose 2-3 options.
- Place it directly below the new interactive How It Works section, same overall area of the page.
- Give it its own distinct `id` so any internal links still resolve correctly (nav currently points `#how` at "how it works" — make sure `#how` ends up pointing at the NEW archetype section, since that's what "How it works" should mean now; the onboarding block gets a new id like `#getting-started`).

## TASK 4 — HUMAN TONE PASS

Rewrite the hero chat bubble line. Current: "Hi! I'm Zenny - your AI workforce for customer conversations. I can answer, book, follow up, and route the right details." This sounds like a feature list, not a person. Make it sound like a real, capable team member greeting a customer — warm, brief, no self-description of AI capabilities.

Apply the same standard to every conversation example on the page, old and new: if a line reads like the AI explaining what it does, rewrite it as the AI actually doing its job in-character.

## QUALITY CHECK BEFORE DONE
- [ ] How It Works section is interactive (pills + 3 scrollable chat scenarios per archetype)
- [ ] Attractor copy above the component actually makes someone want to click
- [ ] All chat copy sounds human, not like AI self-description
- [ ] Call Automation removed from Features and Platforms
- [ ] Old onboarding block preserved, renamed, relocated, working id
- [ ] Nav `#how` link resolves to the new archetype section
- [ ] Logo unchanged (`img/zenny_logo.png`)
- [ ] No backend/integration code touched
- [ ] Single working HTML file
