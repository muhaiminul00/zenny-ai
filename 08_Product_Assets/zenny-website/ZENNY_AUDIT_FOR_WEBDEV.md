# Zenny Website — Audit Report

Review of the current live site against what Zenny actually is as a product. Pricing cards and call automation are out of scope for this report.

## 1. Positioning — reads as a generic chatbot, not what the product is
**Error:** Hero and Features copy describe Zenny in generic AI-chatbot terms (answers questions, automates FAQs, handles orders) — the same language any commodity chatbot tool would use.
**Correction:** Zenny is an AI workforce with five connected functions (respond, convert, recover, manage, report) that behaves differently depending on the business type it's deployed for — e.g. dispatcher-style urgency for emergency services, advisor-style selling for ecommerce, consultative qualifying for agencies. This distinction should be stated explicitly and early, since it's the core differentiator from a generic chatbot.

## 2. No demonstration of industry-specific behavior
**Error:** Nothing on the page shows that Zenny's conversation style changes per business type. All copy and examples are generic and would apply to any business.
**Correction:** The page should show concrete, realistic conversation examples for at least the core business categories Zenny is built for (emergency services, ecommerce/restaurant, appointment-based businesses, consulting/agencies), each demonstrating a distinct persona and tone appropriate to that industry.

## 3. "How it works" section mislabeled
**Error:** The section titled "How it works" (`#how`) actually describes internal onboarding steps — how the business gets set up with Zenny — not how Zenny works with a customer.
**Correction:** "How it works" should describe or demonstrate the customer-facing experience — what happens when a customer messages Zenny. The onboarding-process content is valid but belongs under a different heading (e.g. "Getting Started"), separate from "How it works."

## 4. Features section is a capability list, not an outcome statement
**Error:** Feature cards describe technical capabilities (FAQ automation, order tracking, social replies) without connecting them to business outcomes. This reads as "what it does" rather than "what it's worth to you."
**Correction:** Each capability should be framed around its business result — e.g. not "automatically answers FAQs" but "turns customer questions into trust instead of lost sales." Outcome-first framing, not feature-first.

## 5. Dead JavaScript
**Error:** A billing-toggle script targets a DOM element that only exists inside commented-out (non-rendering) markup elsewhere in the file. The script runs on every page load but does nothing, since its target never exists in the live DOM.
**Correction:** Either remove the dead script entirely, or if a billing toggle is intended to be live, un-hide the markup it depends on so the two match.

## 6. No proof of scale or reliability
**Error:** No response-time claims, uptime data, adoption numbers, or other credibility signals appear anywhere on the page.
**Correction:** Include a small set of verifiable, accurate performance/adoption stats (e.g. response time, support availability, platforms supported) positioned after a section that demonstrates the product working, not before.

## 7. Testimonials — authenticity unclear
**Error:** Testimonial quotes and names appear on the page with no indication of whether they represent real, verified customers.
**Correction:** Only real, verifiable customer testimonials should be published. If none are currently available, this section should not display placeholder or unverified content.

## 8. No page-level navigation aid for a long single-scroll page
**Error:** The page is long (multiple full-viewport sections) with only a 3-item top nav bar and no way to see progress through the page or jump between sections while scrolling.
**Correction:** A persistent, lightweight section indicator (e.g. a scroll-position navigator) would help orient visitors on a page this long, particularly since pricing and proof content are positioned well below the fold.
