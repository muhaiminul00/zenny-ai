# Paper Outline & Abstraction Plan
### Working Title (draft, open to revision)

**"From Behavioral Evidence to Runtime Architecture: A Design Science Case Study in Evidence-Informed Conversational AI Agent Design"**

Alternate, more concise: *"Research-to-Runtime: A Methodology for Grounding Conversational AI Agent Behavior in Behavioral Science"*

---

## Format & Target

- **Attribution:** ZeroManual/Zenny named throughout. Structured so a genericize pass is cheap if a target venue requires blind review during submission (restore identity at camera-ready).
- **Methodology backbone:** Design Science Research (Hevner et al. 2004; Peffers et al. 2007's 6-activity process model) as primary frame, Research through Design (Zimmerman, Forlizzi & Evenson 2007) as the HCI-native complement.
- **Target venue class:** Applied/case-study or industry track of an HCI-adjacent venue (CHI industry track, IUI applied track, or a design-science/IS venue), or a workshop paper as a first step. Decide together once a full draft exists — don't force the shape of a venue we haven't chosen yet.
- **Estimated length:** 6,000–8,000 words (typical for an applied case study paper), excluding references.

---

## Section-by-Section Outline

### 1. Introduction (~600–800 words)

- The gap: conversational AI agent design is typically either (a) built on designer intuition/best-practice heuristics with no explicit evidence grounding, or (b) grounded in psychology/behavioral research that is cited but never systematically translated into a deployed system's actual decision rules.
- Position this paper: documents a case where a company built a complete, multi-domain conversational AI agent runtime, then applied a structured methodology to ground its behavioral rules in behavioral and marketing science literature — producing both validation of existing design choices and concrete, evidenced revisions.
- Contribution claims (kept modest and honest, not oversold):
  1. A named, repeatable methodology (Research → Principle Compression → Architecture Diff → Applied Amendment) instantiating Design Science Research for behavioral-science-grounded agent design.
  2. A case study demonstrating the methodology against a real, complete, multi-domain production architecture — not a synthetic or toy example.
  3. An honest empirical observation from applying it: a majority of the system's existing design choices were independently confirmed by the literature rather than needing revision — a data point relevant to how practitioner-intuitive design tends to track evidence in this domain.
  4. A disciplined epistemic practice (confidence-graded principle compression, preserving contested/non-replicated status from source literature rather than flattening it) that other teams doing similar work could adopt.

### 2. Related Work (~1,000–1,200 words)

Organized into 4 clusters, each grounded in what the initial search surfaced:

- **Human-AI interaction design guidelines** — Amershi et al. (2019) as the closest prior art; explicitly differentiate (they synthesize general guidelines from literature review; this paper documents a *diff process* against one complete, real, already-built system with explicit accept/reject/revise decisions per principle).
- **Trust, algorithm aversion, and AI-specific psychology** — Dietvorst et al. (2015, 2018); Castelo, Bos & Lehmann (2019) task-dependent algorithm aversion; CASA-theory trust-after-failure literature; "gatekeeper aversion" in chatbot deployment (2025).
- **Persuasion and conversion science in computational/HCI contexts** — Cialdini as foundational; the 2025 computational persuasion survey to ground this in HCI/NLP literature rather than only marketing sources; SPIN/consultative-selling research as a cross-disciplinary import worth flagging as unusual in this literature.
- **Service recovery and organizational justice** — Tax, Brown & Chandrashekaran (1998); the contested service recovery paradox (de Matos 2007; Michel & Meuter 2008).
- **Methodology grounding** — Design Science Research (Hevner et al. 2004; Peffers et al. 2007); Research through Design (Zimmerman et al. 2007).
- **Gap statement:** no existing work documents this specific translation pipeline — literature → compressed, confidence-graded principles → systematic diff against a complete deployed architecture → prioritized applied revision — with the diff outcomes and reasoning made explicit and auditable.

### 3. Methodology (~1,200–1,500 words)

Framed explicitly as an instantiation of Peffers et al.'s 6 DSR activities, mapped onto 4 executed phases:

- **Phase 1 — Research Collection.** Structured literature synthesis across 7 domains (decision psychology, buying-journey psychology, trust formation with AI, sales/conversion science, complaint/service-recovery psychology, follow-up/recovery psychology, channel psychology). Source-quality discipline: explicit distinction between peer-reviewed/seminal findings and vendor/industry data, and explicit flagging of contested or failed-to-replicate findings rather than presenting a falsely unified consensus.
- **Phase 2 — Principle Compression.** Each finding compressed into a structured "principle card": source → human behavior → design rule → confidence grade (High/Medium/Low, preserving contested status) → affected system area. This structured compression format is itself presented as a minor methodological contribution — a reusable template for this kind of translation work.
- **Phase 3 — Architecture Diff.** Each principle systematically compared against existing system behavior, classified into one of three outcomes: *confirms* existing design, *new* (genuine gap, not currently addressed), or *flag* (possible tension, requires audit). Emphasize the discipline of NOT silently resolving flags — audited, documented, closed only when genuinely verified.
- **Phase 4 — Applied Amendment.** Selective, prioritized revision. Explicit discipline of *not* adopting every "new" finding — cost/evidence-strength tradeoffs documented, low-confidence or high-engineering-cost proposals explicitly rejected with reasoning, to avoid uncontrolled scope growth from research findings alone.
- **Reproducibility framing:** the process — not the specific principles or specific system decisions — is the generalizable contribution. Any team with a deployed conversational system could run this same 4-phase process against their own architecture.

### 4. Case Study: Applied Patterns (~2,000–2,500 words — the core content section)

Presented as **6 illustrative pattern cases**, not an exhaustive list of all findings (the full research/principle library — 47 principles — is available as a companion artifact per the Limitations section, not reproduced in full here). Each case follows the same 4-part template: *Research finding → Derived principle → Existing architectural pattern (abstracted) → Diff outcome & reasoning.*

**Proposed 6 cases** (selected for pedagogical value and defensibility under the abstraction rules below — see full reasoning in that section):

1. **Discovery-sufficiency gate** — cognitive-load/SPIN research → a formal decision boundary for "when has enough information been gathered before recommending or advancing." (Illustrates: *new*/refined outcome, a genuinely hard design problem solved concretely.)
2. **AI-disclosure and persona calibration** — algorithm aversion research → a rule governing how human-like the agent's persona presents itself and when it discloses AI status. (Illustrates: *new* outcome, flagship finding, highest real-world stakes.)
3. **Tiered, consent-earning data collection** — reciprocity and foot-in-the-door research → a staged model for when and how contact information is requested. (Illustrates: *confirms* outcome — strong pre-existing alignment — good example of intuitive design already tracking evidence.)
4. **Service-recovery-paradox audit** — contested literature on whether service recovery increases loyalty → an explicit audit of existing complaint-handling language to verify no false assumption was embedded. (Illustrates: the *flag → audit → close* process itself, a case where the outcome was "no change needed" but the verification mattered.)
5. **Re-engagement cadence timing** — cart-abandonment and lead-response-time research → validation of existing follow-up timing, paired with a correction of a commonly-misattributed statistic in this literature. (Illustrates: *confirms* outcome + a methodological point about source-hygiene in applied work.)
6. **Complexity-based (not demographic-based) escalation routing** — task-complexity research contradicting assumed generational channel preferences → a corrected design assumption. (Illustrates: *new*/*corrective* outcome, shows the process catching a plausible-but-wrong intuitive assumption.)

### 5. Discussion (~800–1,000 words)

- Why did a majority of findings *confirm* existing design rather than reveal gaps? Discuss candidate explanations with appropriate uncertainty: practitioner design in this domain may already implicitly converge on sound principles through iteration; selection effects in what research exists and gets found; the possibility that confirmation bias affected the diff process itself (address directly, don't dodge).
- Where genuine gaps concentrated (AI-specific trust/persona literature) — discuss why: this is a newer research area than general customer-service psychology, and "AI-specific" design considerations may be a blind spot even for teams doing otherwise-sound customer-service design.
- Hard calls encountered during the process (present 1–2 concretely, abstracted per the rules below) — honest discussion of where the methodology required genuine judgment, not mechanical application.
- Practical implications for other teams building conversational agents.

### 6. Limitations (~500–600 words)

- Single-company, single-system case study — not a controlled experiment, not statistically generalizable.
- **Pre-production contribution.** The system has not yet been evaluated with live outcome data (no measured CSAT, conversion, or resolution-rate deltas). This paper documents a design-stage methodology and its outputs, not validated performance improvements — stated plainly, not hedged.
- Some source literature itself carries contested or non-replicated status — flagged throughout, but the overall confidence of any given design decision is only as strong as its weakest linked source.
- Principle compression and the diff process involved subjective judgment despite the confidence-grading discipline — a different team applying the same process to the same literature might reach different conclusions on ambiguous cases.
- **The full architecture is withheld for competitive/business reasons.** Addressed directly as a genuine tension with reproducibility, not minimized — this paper offers the methodology and illustrative pattern cases as the reproducible contribution, while the complete specification remains proprietary.

### 7. Conclusion (~300–400 words)

- Restate the contribution.
- Future work: production evaluation once the system has live deployment data; cross-system replication of the methodology by other teams/architectures; possible future public release of the full confidence-graded principle library (the Phase 2 research artifact) as a standalone resource for the field, independent of any single company's architecture.

### 8. References

Full citation list, compiled from Phase 1's sources plus today's supplementary search.

### Appendix (decide later, optional)

Candidate: the full 7-domain research synthesis (Phase 1 document) as supplementary material, or a note that it is available on request. A real, common academic option — worth deciding once the main draft is further along.

---

## Abstraction Plan — Requires Your Sign-Off

This is the part most likely to need your judgment before I draft the Case Study section. Proposed rules:

**Safe to name directly (generic, industry-standard, not competitively sensitive):**
- Archetype-level category names (e.g., "time-critical service dispatch," "relationship-driven scheduling," "high-consideration advisory sales") — these are functional business categories, not proprietary mechanisms. I'd describe them functionally rather than using your internal archetype names, to keep the paper readable to an audience unfamiliar with your specific product.
- General architectural *concepts*: tiered data collection, confidence-gated decision-making, a behavioral-freedom scale, module-ownership boundaries, a discovery-sufficiency gate. These are design patterns, comparable to how a company might publish an engineering blog post about general architecture patterns without publishing source code.
- The shape of the score-gate concept (a low tier that nurtures, a mid tier that proceeds normally, a high tier that gets priority handling) — generic enough as a pattern to describe.

**Never named — described only at the pattern level:**
- Actual module names (Growth Agent, Conversion Engine, etc.) — replaced with functional descriptions ("a discovery/recommendation module," "a transaction-completion module").
- Specific numeric thresholds (exact cart-value escalation amounts, exact score-gate cutoffs, exact recovery-cadence hour/day intervals) — described qualitatively ("a multi-step, archetype-differentiated cadence" rather than "15 minutes, 6 hours, 24 hours").
- Specific config flag names, webhook/tool names, field names.
- Any content from `Agent_Runtime_System_v1.md` reproduced verbatim — every pattern gets paraphrased and generalized, never quoted.

**Judgment calls I want your explicit confirmation on:**
1. Is describing the 5 archetype *categories* functionally (without naming them Emergency/Commerce/Appointment/Consultation/Engagement) the right level of caution, or is even that too revealing? My instinct: functional description without your internal names is safe and reads better academically anyway.
2. For the score-gate pattern (Case 6's cousin, referenced elsewhere) — is describing 3 generic tiers (low/mid/high) without the specific 50/85 cutoff numbers sufficiently abstracted, or should the tier concept itself be described even more loosely (e.g., "a threshold-based routing scheme" without specifying 3 tiers)?
3. Company/product names: "ZeroManual" and "Zenny" used normally throughout, per our attribution decision — confirming this extends to naming the *product* specifically (not just the company) in the case study section, since that's where it matters most.

---

## Next Step

Pending your review of this outline and the abstraction rules above: I draft **Section 1 (Introduction) + Section 2 (Related Work)** first, since if the paper's central claim or positioning is off, everything downstream needs to change — better to catch that in ~1,800 words than after the full draft.
