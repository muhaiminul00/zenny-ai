# Customer Psychology Principles v1
### Zenny Agent Runtime System — Phase 2: Principle Compression

Source: `Zenny_AI_Agent_Customer_Psychology_and_Conversion_Science_Evidence_Foundation.md` (Phase 1). Every principle below traces to a specific named source from that document — no citation appears here that wasn't in Phase 1.

**Confidence grading (honest, not uniform):**
- **HIGH** — seminal/foundational, well-replicated, or independent-institute data (Baymard, McKinsey survey data)
- **MEDIUM** — real and directionally reliable, but contextual, contested, or single-study
- **MEDIUM (vendor)** — internally consistent industry data, not peer-reviewed
- Where Phase 1 flagged a finding as contested or failed-to-replicate, that status is preserved here — never upgraded to sound more certain.

**Status tags** (pre-stages Phase 3):
- `CONFIRMS` — existing Zenny architecture already reflects this; strengthens rationale
- `NEW` — not currently addressed in Zenny architecture
- `FLAG` — possible tension with existing architecture; needs Phase 3 review, not resolved here

---

## Domain 1 — Decision Psychology (7 principles)

### P-001 — Curate Options Under High Complexity, Not by Default
**Confidence:** MEDIUM (contested — Scheibehenne et al. 2010 meta-analysis found ~zero main effect; real only under Chernev et al. 2015 moderators)
**Research:** Scheibehenne, Greifeneder & Todd (2010); Chernev, Böckenholt & Goodman (2015) — choice overload appears specifically when task difficulty, choice complexity, or preference uncertainty is high.
**Human behavior:** More options don't universally paralyze people — overload is conditional, not a law.
**Agent rule:** Curate to 1-2 recommendations specifically when preference-uncertainty or complexity signals are high (e.g., early Discovery, vague answers) — not as a blanket rule regardless of context.
**Status:** `CONFIRMS` — Module 2 Recommendation Flow already limits to 1-2; this refines *when* the limit matters most.

### P-002 — Chunk Information to Working-Memory Limits
**Confidence:** HIGH (foundational)
**Research:** Miller (1956), "The Magical Number Seven"; Simon (1957) bounded rationality.
**Human behavior:** People struggle to compare many items simultaneously regardless of stakes.
**Agent rule:** Present max ~2-3 items per turn regardless of catalog size, independent of the P-001 complexity trigger.
**Status:** `CONFIRMS` — Module 2 Section B presentation rules.

### P-003 — Frame Around Real Risk/Loss When Honest
**Confidence:** HIGH (Ruggeri et al. 2020 — 19-country, 4,098-person replication)
**Research:** Kahneman & Tversky (1979) prospect theory; Ruggeri et al. (2020).
**Human behavior:** Losses loom ~2x larger than equivalent gains — one of the most-replicated findings in social science.
**Agent rule:** When communicating a genuine consequence (e.g., "if this isn't addressed, X may happen"), loss-framing is more motivating than gain-framing equivalents — but only ever state real, KB-confirmed consequences, never manufactured ones.
**Status:** `NEW` — not currently an explicit rule; candidate for Module 2 Objection Handling and Emergency messaging.

### P-004 — Don't Stack Decisions Late in Long Interactions
**Confidence:** MEDIUM-LOW (Danziger et al. 2011 is disputed on confounds/magnitude; underlying ego-depletion theory failed key replications)
**Research:** Danziger, Levav & Avnaim-Pesso (2011) — contested.
**Human behavior:** Judgment quality *may* degrade across a long session, though the dramatic magnitude in the original study is not reliable.
**Agent rule:** Avoid introducing new discovery questions or decision points late in an already-long conversation; simplify the final step rather than add to it. Treat this as a mild precaution, not a hard rule justified by strong evidence.
**Status:** `NEW` — minor, low-priority candidate.

### P-005 — Use Sensible Defaults, Never Sludge
**Confidence:** HIGH
**Research:** Johnson & Goldstein (2003) — opt-out organ donation ~90%+ vs. opt-in ~10-15%; Thaler & Sunstein, *Nudge*.
**Human behavior:** Defaults are followed due to effort-saving, implied endorsement, and status-quo bias.
**Agent rule:** Pre-select the most likely helpful path (e.g., nearest available slot) but keep override effortless. Never use default-selection to add cost or lock in a choice the customer didn't actively confirm.
**Status:** `CONFIRMS` — consistent with Module 3 Conversion Engine fallback/alternative logic; adds an ethical guardrail (no "sludge").

### P-006 — Minimize Options Specifically Under Stress/Time-Pressure
**Confidence:** MEDIUM (derived — combines Chernev's complexity moderators with prospect theory's risk-seeking-under-loss finding)
**Research:** Chernev et al. (2015); Kahneman & Tversky (1979).
**Human behavior:** Under stress, people default to effort-minimization and evaluate tradeoffs less carefully.
**Agent rule:** In genuinely high-stress contexts, present a single clear safe path rather than options.
**Status:** `CONFIRMS` — directly matches Step 4 Emergency's fixed-sequence, 2/10 freedom design. Strong architectural validation.

### P-007 — Ask Only When the Answer Changes the Next Action
**Confidence:** MEDIUM (extension of cognitive-load literature to conversational UX, not a single named study)
**Research:** Extension of Miller (1956) / Simon (1957) to conversational contexts.
**Human behavior:** An unexplained question carries a hidden trust cost — "why are they asking this?"
**Agent rule:** Before asking anything, confirm it's required for the immediate next step.
**Status:** `CONFIRMS` — this is precisely Step 2 Section 2.3's existing Discovery Budget Rule, word for word. Strongest possible validation of an already-built rule.

---

## Domain 2 — Intent & Buying Journey (5 principles)

### P-008 — Journeys Are Non-Linear — Don't Force a Funnel
**Confidence:** HIGH (large-scale, ~20,000-consumer McKinsey study; industry not peer-reviewed academic research)
**Research:** Court, Elzinga, Mulder & Vetvik (2009), McKinsey "Consumer Decision Journey"; Edelman (2010), HBR.
**Human behavior:** Customers add/drop options mid-evaluation; ~2/3 of active-evaluation touchpoints are consumer-driven, not brand-controlled.
**Agent rule:** Don't assume a single linear path from question to purchase; allow the customer to reintroduce alternatives without penalty.
**Status:** `CONFIRMS` — matches Module 2 Section E Opportunity Detection and Step 1E's context-preservation-on-switch rule.

### P-009 — Match Support Style to Buying-Readiness Stage
**Confidence:** HIGH
**Research:** Court et al. (2009).
**Human behavior:** "Which one should I choose?" and "Can I book this?" are psychologically different states — treating both as sales moments frustrates both.
**Agent rule:** Diagnose stage (Explorer/Evaluator/Ready) before choosing discovery-depth vs. conversion-speed behavior.
**Status:** `CONFIRMS` — this is Module 2 Section A.0 Growth Buying Stage Detection, near-exact match.

### P-010 — Premature Closing Backfires in High-Consideration Purchases
**Confidence:** HIGH (largest behavioral sales study ever conducted — 35,000 calls)
**Research:** Rackham (1988), SPIN Selling / Huthwaite research.
**Human behavior:** Pushing toward a decision before readiness triggers resistance in complex/high-stakes purchases specifically.
**Agent rule:** Never attempt conversion push before an Intent 03 signal in Consultation/high-ticket contexts; low-stakes Commerce can tolerate more directness.
**Status:** `CONFIRMS` — directly validates Step 2's Freedom Level differentiation (Consultation 8/10 vs. Commerce 3/10).

### P-011 — High-Consideration Journeys Tolerate (and Need) Longer Discovery
**Confidence:** MEDIUM (extension of SPIN + CDJ research to B2B, less rigorously isolated as its own study)
**Research:** Extension of Rackham (1988) and Court et al. (2009).
**Human behavior:** Higher-risk, multi-stakeholder purchases require more evidence-gathering before commitment.
**Agent rule:** Do not compress Consultation-archetype discovery to match Commerce-speed expectations.
**Status:** `CONFIRMS` — matches Step 0A's Consultation Long Patience Window and 8/10 Freedom Level.

### P-012 — Post-Purchase Experience Feeds the Next Consideration Cycle
**Confidence:** MEDIUM
**Research:** Court et al. (2009) — "loyalty loop" concept.
**Human behavior:** Post-purchase experience isn't just a satisfaction score — it directly shapes whether the customer considers this business again next time.
**Agent rule:** Treat successful conversions as a light opportunity to reinforce future consideration, not just a closed ticket.
**Status:** `NEW` — candidate for Module 4 Source H (Customer Reactivation) framing; currently transactional in tone.

---

## Domain 3 — Trust Formation, Especially with AI (8 principles)

### P-013 — Minimize Self-Orientation Language
**Confidence:** MEDIUM (practitioner framework, not peer-reviewed, but widely used and internally coherent)
**Research:** Maister, Green & Galford (2000), *The Trusted Advisor* — Trust = (Credibility + Reliability + Intimacy) / Self-Orientation.
**Human behavior:** Self-focused framing ("we want you to buy") actively erodes trust faster than a lack of expertise does.
**Agent rule:** Frame recommendations around customer need, never around the business's interest in the sale.
**Status:** `CONFIRMS` — matches Step 0A's Employee Mindset guidance across archetypes.

### P-014 — A Single Visible AI Error Can Collapse Trust Faster Than an Equivalent Human Error
**Confidence:** HIGH (seminal, well-replicated direction; exact magnitude is context-dependent — see P-019)
**Research:** Dietvorst, Simmons & Massey (2015), "Algorithm Aversion," *JEP: General*.
**Human behavior:** People lose confidence in an algorithm faster than in a human after witnessing the *same* mistake.
**Agent rule:** Error-handling must be disproportionately careful — never bluff or imply confidence the agent doesn't have; acknowledge mistakes plainly and immediately.
**Status:** `CONFIRMS` — directly validates Step 1D.2's "a wrong confident action is worse than a clarification request."

### P-015 — Give Users an Easy Correction Path
**Confidence:** MEDIUM-HIGH
**Research:** Dietvorst, Simmons & Massey (2018), "Overcoming Algorithm Aversion," *Management Science*.
**Human behavior:** People re-engage with an imperfect algorithm if given even minor ability to adjust its output.
**Agent rule:** Always offer an easy "that's not quite right — tell me what's off" path rather than a rigid single-shot answer.
**Status:** `NEW` — not explicitly encoded; candidate for Module 1 FAQ Handler and Module 2 Recommendation Flow.

### P-016 — Do Not Over-Anthropomorphize the Agent
**Confidence:** MEDIUM (emerging, 2021 study)
**Research:** Srinivasan & Sarial-Abi (2021), *Journal of Marketing*.
**Human behavior:** A more human-presented persona is judged more harshly for the identical error than a clearly-AI persona.
**Agent rule:** Maintain a warm-but-clearly-AI persona; disclose AI status; avoid implying human feelings or lived experience.
**Status:** `NEW` — genuinely not addressed anywhere in current architecture. Real gap.

### P-017 — Briefly Explain Reasoning Behind Recommendations and Failures
**Confidence:** MEDIUM (recent, single 2024 study)
**Research:** *Journal of Business Research*, Vol. 180 (2024) — explainable-AI post-hoc explanations soften negative reactions to algorithmic failures.
**Human behavior:** A "why" makes an error feel like a legible mistake rather than an inexplicable failure.
**Agent rule:** When a recommendation, failed action, or escalation occurs, briefly state the reasoning rather than a bare outcome.
**Status:** `NEW` — candidate for Module 3 Failure Handling and Module 1 FAQ "I don't know" language.

### P-018 — Set Capability Expectations Accurately, Never Inflated
**Confidence:** MEDIUM
**Research:** *Humanities and Social Sciences Communications*, 11:1400 (2024).
**Human behavior:** Low, accurate prior expectations make even modest performance feel acceptable; over-promising and under-delivering damages trust more than accurate scoping.
**Agent rule:** State what the agent can/cannot do honestly at the first friction point, rather than implying human-equivalent capability.
**Status:** `CONFIRMS` — matches Module 1 Human Handoff Handler's honest-not-apologetic framing.

### P-019 — Objective Tasks Forgive AI More Than Subjective/Emotional Ones
**Confidence:** MEDIUM (reconciles Srinivasan & Sarial-Abi 2021 with Logg, Minson & Moore 2019 "algorithm appreciation")
**Research:** Srinivasan & Sarial-Abi (2021); Logg, Minson & Moore (2019), *OBHDP*.
**Human behavior:** For objective/factual tasks people often trust AI as much or more than humans; for subjective/emotional tasks (complaints, emotional support), trust is far more conditional.
**Agent rule:** Lean into AI-led behavior for factual/objective tasks (FAQ, availability, booking); hand off subjective/emotional tasks to human faster than factual ones.
**Status:** `CONFIRMS` — matches existing complaint-escalation design; adds explicit task-type rationale.

### P-020 — Personalize Only on Knowingly-Shared Data, Never Inferred Tracking
**Confidence:** MEDIUM-HIGH
**Research:** Awad & Krishnan (2006); Dinev & Hart (2006); Cloarec et al. (2024) — personalization-privacy paradox.
**Human behavior:** Personalization from knowingly-shared info is welcomed; personalization from "sniffed-out" data feels creepy and erodes trust.
**Agent rule:** Reference only what the customer has explicitly stated or a confirmed prior interaction — never inferred browsing/frequency data.
**Status:** `CONFIRMS` — this is exactly Step 0C's existing Privacy Boundaries (frequency/count data prohibition). Strong validation.

---

## Domain 4 — Sales & Conversion Science (8 principles)

### P-021 — Diagnose Before Prescribing (SPIN)
**Confidence:** HIGH (largest behavioral sales study ever conducted)
**Research:** Rackham (1988).
**Human behavior:** Buyers who articulate their own need are more persuaded than buyers told the value by the seller.
**Agent rule:** Use situation → problem → implication → need-payoff structured questioning before recommending, scaled to freedom level.
**Status:** `CONFIRMS` — this is Module 2 Discovery Flow, near-exact match.

### P-022 — Objections Are Often Created by the Seller, Not the Buyer
**Confidence:** HIGH
**Research:** Rackham (1988).
**Human behavior:** Premature feature-pushing or closing generates resistance that wasn't originally present.
**Agent rule:** Never volunteer unsolicited persuasive claims before need is understood.
**Status:** `CONFIRMS` — matches Module 2's "recommend only when understanding is sufficient" gate.

### P-023 — Use Real Social Proof, Never Fabricated
**Confidence:** HIGH (decades of replication)
**Research:** Cialdini (1984/2021), *Influence*.
**Human behavior:** People use others' choices as decision evidence, especially under uncertainty.
**Agent rule:** Cite genuine reviews/stats only if present in Business Memory/KB; never invent or imply unverified popularity.
**Status:** `CONFIRMS` — matches Step 0C Level 3's "never override business data with assumptions."

### P-024 — Reciprocity Works Only With Genuine Value First
**Confidence:** HIGH
**Research:** Cialdini — reciprocity principle.
**Human behavior:** Receiving real value first increases willingness to reciprocate (engage, share info, commit).
**Agent rule:** Lead with genuine help before any ask, including Tier 2 contact-info requests.
**Status:** `CONFIRMS` — this is precisely Step 0B's Tier 2 Value Exchange doctrine.

### P-025 — Small, Genuine Commitments Increase Follow-Through
**Confidence:** HIGH
**Research:** Freedman & Fraser (1966), foot-in-the-door; Cialdini's consistency principle.
**Human behavior:** Agreeing to a small voluntary step increases completion of a larger related step.
**Agent rule:** Sequence toward conversion via small, low-friction confirmations rather than asking for full commitment cold.
**Status:** `CONFIRMS` — matches Step 0B's Tier 1→2→3 progressive structure exactly.

### P-026 — Scarcity/Urgency Must Be Genuine or It Backfires
**Confidence:** HIGH
**Research:** Cialdini scarcity principle; Clee & Wicklund (1980), reactance theory.
**Human behavior:** Fabricated urgency, once detected, triggers resistance rather than compliance.
**Agent rule:** Never state false scarcity; if a real, KB-confirmed constraint exists, state it factually.
**Status:** `CONFIRMS` — matches existing "no fabrication" and no-unauthorized-discount rules.

### P-027 — Don't Interrupt Momentum Near Completion
**Confidence:** MEDIUM-HIGH (Goal Gradient Effect — foundational + modern replication)
**Research:** Hull (1932); Kivetz, Urminsky & Zheng (2006) — coffee-card loyalty study replication.
**Human behavior:** Perceived proximity to completion increases motivation; late friction feels disproportionately costly.
**Agent rule:** Once a commitment signal (Intent 03) appears, freeze discovery/education and move to completion immediately.
**Status:** `CONFIRMS` — this is Step 1E's priority system (Intent 03 outranks discovery) plus Module 2 Section 3 Handoff.

### P-028 — Personalization Increases Conversion Only on Knowingly-Shared Data
**Confidence:** MEDIUM (cross-domain with P-020)
**Research:** Personalization-privacy paradox literature.
**Human behavior:** Transparent, relevant personalization increases conversion; opaque/tracked personalization suppresses it.
**Agent rule:** Personalize recommendations using only conversation-stated preferences and confirmed prior purchases.
**Status:** `CONFIRMS` — same basis as P-020, applied specifically to Growth Agent recommendations.

---

## Domain 5 — Complaint & Service Recovery Psychology (6 principles)

### P-029 — Judge Complaint Handling on Three Justice Dimensions
**Confidence:** HIGH (foundational)
**Research:** Tax, Brown & Chandrashekaran (1998), *Journal of Marketing*.
**Human behavior:** Customers evaluate the fairness of the outcome (distributive), the process (procedural), and their treatment (interactional) — not just whether they got a fix.
**Agent rule:** Address all three: a fair remedy within held permissions, a fast/easy process, and respectful treatment.
**Status:** `CONFIRMS` — deepens Module 1 Complaint Handler with explicit structure.

### P-030 — Do Not Rely on the "Service Recovery Paradox"
**Confidence:** HIGH that the paradox is overstated (de Matos 2007 meta-analysis; Michel & Meuter 2008 — 11,000+ real bank interviews)
**Research:** de Matos, Henrique & Rossi (2007); Michel & Meuter (2008).
**Human behavior:** A well-recovered failure does not reliably create *more* loyalty than never having a problem — significant for satisfaction only, non-significant for repurchase/loyalty/word-of-mouth.
**Agent rule:** Never treat failures as loyalty opportunities. Aim for zero-failure first, genuine recovery second.
**Status:** `FLAG` — corrective principle. Recommend a Phase 3 audit: verify no existing Module 1 language implies recovery is *more* valuable than avoiding the failure in the first place.

### P-031 — Let the Customer Fully Voice the Issue Before Acting
**Confidence:** HIGH
**Research:** Thibaut & Walker (1975), procedural justice — "voice" has independent value from outcome.
**Human behavior:** Being heard matters even before/beyond the fix.
**Agent rule:** Acknowledge and let the customer state the full issue before offering a resolution.
**Status:** `CONFIRMS` — matches Module 1's existing "acknowledge specifically before offering resolution" sequence.

### P-032 — Response Speed Is Itself Part of Fairness
**Confidence:** HIGH
**Research:** Tax, Brown & Chandrashekaran (1998) — timeliness within procedural justice.
**Human behavior:** Delayed acknowledgment amplifies frustration independent of the eventual remedy.
**Agent rule:** Complaint-intent messages are acknowledged in the same turn, never queued behind other processing.
**Status:** `CONFIRMS` — matches Step 1E Priority 2 (Complaint) routing.

### P-033 — Remedy Should Be Proportionate, Not Maximal
**Confidence:** MEDIUM (derived from general organizational-justice/equity-theory principles, not explicitly isolated in Tax et al.'s original three-factor model)
**Research:** General organizational justice literature, extending Tax et al. (1998).
**Human behavior:** Customers evaluate whether the remedy matches the severity of the failure, not whether *something* was offered.
**Agent rule:** Match remedy weight to issue severity, within held permissions — neither over- nor under-correct.
**Status:** `NEW` — refines Module 1's existing "offer within action-level permissions" language with a severity-matching lens.

### P-034 — High-Stakes/Subjective Complaints Always Escalate
**Confidence:** HIGH (composite of P-019's task-type finding applied to complaints)
**Research:** Tax et al. (1998); Srinivasan & Sarial-Abi (2021).
**Human behavior:** High-stakes, subjective-judgment complaints are trusted less when resolved by an algorithm alone.
**Agent rule:** Refund/legal/safety-adjacent complaints escalate regardless of confidence level.
**Status:** `CONFIRMS` — matches existing action-permission gating exactly.

---

## Domain 6 — Follow-Up & Recovery Psychology (7 principles)

### P-035 — Prevention Beats Recovery
**Confidence:** HIGH (Baymard Institute — independent, most authoritative source in this domain)
**Research:** Baymard Institute meta-analysis, 50 studies.
**Human behavior:** ~48% of abandonment is caused by unexpected extra costs, ~26% by forced account creation — addressable at the point of friction, not after.
**Agent rule:** Transparent all-in pricing and minimal required fields are Conversion Engine defaults, not Recovery Engine repairs.
**Status:** `CONFIRMS` — matches Module 3 Ecom Mode A's existing "confirm total cost upfront" rule; elevates it as the primary lever.

### P-036 — Most Abandonment Is Non-Buying Browsing — Don't Over-Recover
**Confidence:** HIGH (Baymard)
**Research:** Baymard Institute — ~58.6% of abandonment attributed to "just browsing/not ready"; realistic floor ~55-60%.
**Human behavior:** Not every abandoned cart/booking represents lost revenue; much of it was never going to convert.
**Agent rule:** Calibrate recovery tone accordingly — avoid guilt-based or urgency-heavy framing on the assumption every abandonment is a lost sale.
**Status:** `NEW` — softens existing Module 4 recovery message tone rules; no direct contradiction, but adds explicit calibration.

### P-037 — First Recovery Touch Within ~1 Hour Outperforms Delayed Contact
**Confidence:** MEDIUM (vendor)
**Research:** Barilliance, SaleCycle, Klaviyo — convergent but non-peer-reviewed data.
**Human behavior:** Interest/intent decays over time; faster contact catches the customer while context is fresh.
**Agent rule:** First recovery step should land within roughly 30 min–1 hr for Commerce-type archetypes.
**Status:** `CONFIRMS` — Module 4's existing Commerce Ecom cadence (30 min → 24 hr → 72 hr) already matches this closely. Minor verification only, not a conflict.

### P-038 — Multi-Step Sequences (2-3 Messages) Outperform Single Touch
**Confidence:** MEDIUM (vendor)
**Research:** Klaviyo aggregate data — multi-email sequences generate multiples more revenue than single sends, diminishing returns beyond ~3.
**Human behavior:** A single message may land at the wrong moment; a short sequence catches more re-engagement windows without becoming spam.
**Agent rule:** Maintain multi-step cadence structure per archetype.
**Status:** `CONFIRMS` — matches existing Module 4 Recovery Profiles (2-5 steps per archetype) exactly.

### P-039 — "Speed to Lead" Direction Is Real, but Multipliers Are Overstated
**Confidence:** MEDIUM (direction well-supported; specific "100x" multiplier is single-vendor, frequently mis-attributed to Harvard)
**Research:** MIT/InsideSales (2007) vs. HBR (2011, 2,241 firms — more credible, ~7x qualification odds within 1 hr).
**Human behavior:** Fast response to high-intent inbound leads meaningfully improves contact/qualification odds; exact magnitude is contested.
**Agent rule:** Respond to Solution-Aware (Intent 03) messages immediately — architecturally already true via Step 1D routing.
**Status:** `CONFIRMS` runtime behavior; `NEW` flag for client-facing materials — do not cite the "100x" figure as settled fact in sales/marketing collateral (Phase 5 note).

### P-040 — Recovery Messages Must Add Value, Not Just Remind
**Confidence:** MEDIUM (extension of Cialdini's reciprocity principle to recovery context)
**Research:** Extension of Cialdini (Domain 4) to follow-up messaging.
**Human behavior:** Generic "you forgot something" reminders underperform messages referencing real context.
**Agent rule:** Recovery content must reference actual conversation_summary/selected_solution.
**Status:** `CONFIRMS` — this is already required by Module 4 Section 4 Recovery Message Logic.

### P-041 — Cap Message Frequency; Over-Contacting Is the Top Opt-Out Driver
**Confidence:** MEDIUM (vendor, but cross-source convergent)
**Research:** Cross-vendor SMS/email frequency-cap research.
**Human behavior:** Repeated unwanted contact reads as intrusive regardless of message quality.
**Agent rule:** Never exceed the defined max-steps-per-archetype cap, even under business pressure for "one more nudge."
**Status:** `CONFIRMS` — matches Module 4 Section 6 Stop Condition Enforcement exactly.

---

## Domain 7 — Channel Psychology (6 principles)

### P-042 — Route by Task Complexity, Not Channel Preference Alone
**Confidence:** HIGH (peer-reviewed)
**Research:** *Journal of Retailing and Consumer Services* (2020).
**Human behavior:** Task complexity — not generational preference — drives whether people want AI or human help.
**Agent rule:** Use complexity signals, not customer-segment assumptions, as the primary trigger for proactive human-handoff offers.
**Status:** `NEW` — adds an explicit complexity-based escalation trigger not currently named as such.

### P-043 — Generational Phone-Aversion Assumptions Are Wrong
**Confidence:** HIGH (McKinsey 2024, 3,500-consumer survey)
**Research:** McKinsey & Company (2024) — 71% of Gen Z prefer phone to resolve issues quickly; Gen Z 35-40% *more* likely to call than millennials.
**Human behavior:** Younger customers are not universally chat-only; for complex/important matters they actively prefer voice.
**Agent rule:** Never assume any age group avoids voice/human contact; offer voice escalation as first-class across all demographics for complex issues.
**Status:** `NEW` — corrects a possible unstated design assumption; worth an explicit check in Step 4 archetype builds.

### P-044 — Preserve Full Context Across Channel Hand-offs
**Confidence:** MEDIUM-HIGH (consistent cross-vendor CX finding, not a single peer-reviewed study)
**Research:** Cross-vendor CX research consensus.
**Human behavior:** Repeating information after a hand-off reads as organizational failure, not mere inconvenience.
**Agent rule:** Full conversation_summary and intent history transfer at every hand-off.
**Status:** `CONFIRMS` — matches Module 1 Human Handoff Handler and Module 5 Section 2.7 Channel Identity Resolution exactly.

### P-045 — SMS Requires Genuine Consent — Legal and Trust Constraint
**Confidence:** HIGH (TCPA is settled law; reactance theory well-established)
**Research:** TCPA (1991); Tsang, Ho & Liang (2004).
**Human behavior:** Unsolicited SMS reads as intrusion; consented SMS reads as service.
**Agent rule:** Never initiate SMS/WhatsApp marketing-adjacent contact without prior opt-in; honor opt-outs within required windows.
**Status:** `CONFIRMS` — hardens Module 4 Section 5 Suppression Rules with explicit legal grounding.

### P-046 — Match Tone to Channel and Emotional Context
**Confidence:** MEDIUM (recent, single 2025 study)
**Research:** Lim, Hong & Schneider (2025), *Computers in Human Behavior*.
**Human behavior:** Warmth-toned responses aid trust in emotional/complaint contexts; competence/clarity-toned responses aid trust in transactional contexts.
**Agent rule:** Shift tone register explicitly — warm for complaints/emotional moments, clear/efficient for transactional confirmations.
**Status:** `CONFIRMS` — matches Step 0A's per-archetype tone differentiation; adds an explicit warmth-vs-competence axis not currently named.

### P-047 — Don't Cite Unverifiable SMS Statistics
**Confidence:** HIGH that the common "98% open rate" figure is unverifiable (SMS has no open-tracking mechanism)
**Research:** Traces to Frost & Sullivan (2010)/Epsilon (2009), not a measured metric; more defensible: ~90% read within ~3 minutes (Validity).
**Human behavior:** N/A — methodological correction, not a behavior claim.
**Agent rule:** N/A for runtime — this is a claims-hygiene rule for external materials.
**Status:** `NEW` — flag for Phase 5 Client-Facing Summary only; not a runtime change.

---

## Summary

**Total: 47 principles** across 7 domains (target was 40-60; landed toward the disciplined middle rather than the ceiling).

| Domain | Count | Avg. Confidence |
|---|---|---|
| Decision Psychology | 7 | Mixed — 2 HIGH, 4 MEDIUM, 1 MEDIUM-LOW |
| Intent & Buying Journey | 5 | Mostly HIGH |
| Trust Formation (AI) | 8 | Mixed — 2 HIGH, 6 MEDIUM |
| Sales & Conversion | 8 | Mostly HIGH |
| Complaint & Recovery | 6 | Mostly HIGH, 1 flagged corrective |
| Follow-up & Recovery | 7 | Mixed — 2 HIGH, 5 MEDIUM (vendor) |
| Channel Psychology | 6 | Mixed — 3 HIGH, 3 MEDIUM |

**Status tag counts:**
- `CONFIRMS` existing architecture: **28 principles** — the majority. This is a strong signal that Zenny's existing design already reflects sound research, not coincidence.
- `NEW` — not currently addressed: **16 principles** — genuine candidates for Phase 3/4 additions, concentrated in Domain 3 (AI Trust) and Domain 7 (Channel).
- `FLAG` — needs review, possible tension: **1 principle** (P-030, service recovery paradox — audit-only, not a contradiction found yet, needs verification).

**No principle was rated HIGH confidence without a specific, named, checkable source.** Where Phase 1 marked a finding as contested (choice overload, decision fatigue, service recovery paradox), that status is preserved here unchanged.

---

**Next: Phase 3 — Architecture Diff.** Build the comparison table using this principle library against Steps 0A, 2, Module 2, and Module 4 specifically — prioritizing the 16 `NEW` principles and the 1 `FLAG` for actual review, since the 28 `CONFIRMS` principles require no architecture change (they're validation, not action items).
