# ZENNY WEBSITE REBUILD — AGENT.md v1

## ROLE
Senior frontend engineer + conversion-focused SaaS copy/design editor.
Task: rebuild positioning/structure of existing Zenny website (single HTML file).
NOT rebuilding AI system, backend, integrations.

## PRODUCT TRUTH (do not deviate)
Zenny = AI workforce, not a chatbot.
Five connected jobs:
1. Respond — instant customer answers
2. Convert — turns conversations into bookings/sales
3. Recover — follows up on lost opportunities
4. Manage — handles customer emails/requests
5. Report — shows what the AI produced

Behavior changes per business type (this is the trust lever):
- Emergency services (plumber/roofer/electrician) → Dispatcher. Fast, structured, minimal talk.
- Ecommerce/Restaurant → Sales Advisor. Recommends, reassures, closes.
- Gym/Spa/Salon → Front Desk Advisor. Books, informs, follows up.
- Consulting/Agency → Senior Consultant. Explores situation, qualifies, hands off.

## GOAL
Visitor shifts from "this is an AI chatbot" to
"this is an AI workforce built for my business that captures more revenue."
5-second test: visitor knows who it's for, what it does, why it's different.

## HARD CONSTRAINTS
DO NOT:
- touch backend logic, integrations, Calendly embed, chatbot functionality
- add JS/CSS frameworks or animation libraries
- add fonts or change color tokens
- make it flashy/glassmorphism/gradient-heavy

KEEP:
- single HTML file
- existing CSS variables, class structure, typography
- dark/purple/amber theme
- professional, premium, reliable tone

## SECTION-BY-SECTION CHANGES

### 1. Hero
Rewrite headline + subhead. Move from feature ("AI customer support agent") to outcome/pain.
Add one calm urgency line near hero or problem area, e.g.:
"Customers don't wait. The fastest response usually wins the customer."
Avoid aggressive/negative claims ("you're losing customers daily") — no proof, feels salesy.

### 2. New section — "Not another chatbot"
Insert after About band. Present the 5 jobs as outcomes, not a feature list:
- Respond: customers get answers instantly
- Convert: questions become bookings/purchases/qualified leads
- Recover: lost opportunities get automatic follow-up
- Manage: emails and requests handled
- Report: clear view of what the AI produced

### 3. Rebuild "How It Works"
Reframe from "how we build it" to "how your customer experiences it."
Keep existing 4-step onboarding block — move it below the new tab component, don't delete.
Add tabbed component: Emergency / Ecommerce & Restaurant / Gym-Spa-Salon / Consulting-Agency.
Each tab:
- 1-line framing of the business type
- persona named (Dispatcher / Sales Advisor / Front Desk Advisor / Senior Consultant)
- short realistic 2-3 message conversation, styled with existing `.bubble-agent`/`.bubble-user` classes
- 2-3 outcome checkmarks below

Sample content per tab:

**Emergency Services**
Customer: "My basement is flooding."
Zenny: "I can help. What's your address and how urgent is this?"
✓ Emergency classified ✓ Details captured ✓ Callback prioritized

**Ecommerce / Restaurant**
Customer: "Do you have this jacket in medium?"
Zenny: "Yes — based on your fit preference, I'd recommend this one."
✓ Product match ✓ Purchase assisted ✓ Reservation supported

**Gym / Spa / Salon**
Customer: "I want to book a facial."
Zenny: "I can help. Weekday or weekend works better for you?"
✓ Appointment booked ✓ Questions answered ✓ Follow-up handled

**Consulting / Agency**
Customer: "I need help growing my business."
Zenny: "Tell me about your current lead flow and biggest challenge."
✓ Lead qualified ✓ Consultation booked ✓ Context sent to sales team

Animation: CSS/JS only, no libraries. Subtle fade-in or typing effect on active tab's bubbles. Keep it optional/light — skip if it risks complexity.

### 4. Features section
Same cards/layout, rewrite copy from capability → result.
"FAQ automation" → "Instant customer answers"
"CRM integration" → "Every opportunity captured automatically"

### 5. Pricing
Move down. New page order:
1. Hero
2. Problem (calm urgency line)
3. What Zenny is
4. Not another chatbot (5 jobs)
5. How it works (industry tabs + onboarding steps)
6. Features
7. Platforms
8. Testimonials
9. Pricing
10. Final CTA
11. Footer

### 6. Testimonials
Confirm these are real before keeping. Flag if placeholder/fake — do not fabricate quotes or logos.

### 7. Final CTA
Add one risk-reversal / low-commitment line, e.g.:
"See how Zenny would work inside your business."
No aggressive sales language.

## QUALITY CHECK BEFORE DONE
- [ ] Visitor understands Zenny in 5 seconds
- [ ] Doesn't feel like a generic chatbot product
- [ ] Industry tabs visible and realistic
- [ ] Conversation examples feel real, not scripted-sounding
- [ ] Value established before pricing appears
- [ ] No fabricated claims, stats, or testimonials
- [ ] No backend/integration code touched
- [ ] Still a single working HTML file
