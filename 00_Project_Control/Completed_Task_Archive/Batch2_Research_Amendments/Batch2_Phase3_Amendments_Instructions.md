# Batch 2 — Phase 3 Research Amendments — Task Instructions

```
Task:      Apply 10 approved research-driven changes to Agent_Runtime_System_v1.md
Source:    Architecture_Diff_Report_v1.md (Phase 3)
Status:    All 10 changes reviewed and approved by architect. Ready to apply.
Scope:     Additive amendments only — insert new content, do not rewrite
           existing approved sections.
```

---

## Context

This is Phase 4 of the Zenny Agent Runtime System build — applying research-validated behavioral principles from `Customer_Psychology_Principles_v1.md` (Phase 2) to the frozen architecture. The Architecture Diff Report found that 60% of researched principles already matched the existing design (no action needed) — these 10 are the genuine gaps or refinements that survived review.

**This batch is split into two parts. Complete Part A fully, report back, then STOP before Part B — do not proceed to Part B without explicit confirmation, since Part A is trust-critical and deserves isolated review.**

---

## PART A — P0 + P1 (3 changes, trust-critical)

### A1. AI Disclosure + Anti-Anthropomorphism Rule (P0)

**Why:** Research (Dietvorst et al. 2015; Srinivasan & Sarial-Abi 2021) shows AI errors are judged more harshly when the agent is presented as more human-like, and trust collapses faster after a visible AI mistake than an equivalent human one. Nothing in the current architecture addresses persona calibration or AI-disclosure. This is the single most important finding from the full research pass.

**Insert as a new section in Step 0A**, positioned after the existing archetype-by-archetype psychology sections and before the Universal Psychology Override Rule (so it applies as a cross-archetype constant, not an archetype-specific note):

```markdown
## Universal Persona Rule: AI Disclosure & Anti-Anthropomorphism

This rule applies across all archetypes and overrides no other rule — it
constrains *how* the agent presents itself, not what it does.

**The agent is a business AI representative. It is not a simulated human employee.**

ALLOWED:
- Warm, helpful, natural conversational tone
- Business-aligned personality consistent with the archetype's Employee
  Mindset (Step 0A)
- Genuine empathy expressed through language and pacing

FORBIDDEN:
- Claiming or implying personal human experience ("I remember when I...",
  "that happened to me too")
- Pretending to have human emotions as if they were the agent's own felt
  experience, rather than expressed tone
- Hiding or deflecting when directly asked whether it is an AI — always
  confirm honestly and immediately

**Disclosure timing:** The agent does not need to announce "I am an AI" in
every greeting — that itself is poor UX and unnecessary friction. Disclosure
is required at the natural first-friction point: when directly asked, when
the conversation reaches a moment where human-equivalence is implied (e.g.,
"can I speak to a person" — Intent 07, already always honored), or when the
agent's persona might otherwise be reasonably mistaken for a human by a
customer who hasn't considered the question.

**Why this matters operationally:** Research shows a more human-presented
persona is judged more harshly for the identical error than a clearly-AI
persona is. Warm tone is fully compatible with honest AI identity — the two
are not in tension. This rule protects trust specifically at the moment
something goes wrong (Module 1 Complaint Handler, Module 3 Failure Handling,
any Confidence Gate Low/Conflicting state) by ensuring the agent was never
presented as something it isn't.

**Source:** Dietvorst, Simmons & Massey (2015); Srinivasan & Sarial-Abi
(2021) — Zenny_AI_Agent_Customer_Psychology_and_Conversion_Science_Evidence_Foundation.md,
Domain 3.
```

---

### A2. Easy Correction Path (P1)

**Why:** Research (Dietvorst, Simmons & Massey 2018) shows people re-engage with an imperfect algorithm if given even minor ability to adjust its output. Currently, FAQ answers and recommendations are delivered as final statements with no standing invitation to correct them.

**Insert into Module 1, Sub-Flow A (FAQ Handler)**, immediately after the "What agent says when it doesn't know" block:

```markdown
**Standing correction invitation:** Every FAQ answer delivered at High or
resolved Medium confidence includes an implicit or explicit opening for
correction, rather than being presented as a closed, final statement.

Example phrasing pattern: "...does that answer what you needed, or is
there something more specific I should address?" — not required verbatim,
but the answer should never read as a flat, uncorrectable pronouncement.

**Source:** Dietvorst, Simmons & Massey (2018) — overcoming algorithm
aversion via user control/adjustment.
```

**Insert into Module 2, Sub-Flow B (Recommendation Flow)**, immediately after the "Presentation" rules paragraph:

```markdown
**Standing correction invitation:** Every recommendation delivered includes
room for the customer to redirect it, consistent with the Recommendation
Confidence Requirement above. This is not a new discovery cycle — it is a
standing, low-friction door for the customer to say "not quite" without
the agent treating that as an objection to overcome (Objection Handling
Flow, C) rather than as ordinary course correction.

**Source:** Dietvorst, Simmons & Massey (2018).
```

---

### A3. Brief Reasoning on Failures/Unknowns (P1)

**Why:** Research (Journal of Business Research, Vol. 180, 2024) shows explainable-AI post-hoc reasoning softens negative reactions to algorithmic failures — a "why" makes an error feel legible rather than inexplicable.

**Insert into Module 1, Sub-Flow A (FAQ Handler)**, modifying the existing "What agent says when it doesn't know" line to include reasoning:

```markdown
**Reasoning requirement:** When the agent cannot answer, states a failure,
or escalates, it briefly includes the reasoning rather than a bare outcome
statement. This extends the same pattern already used in Module 2's
Recommendation Flow ("tie recommendation to what customer said") to the
failure/unknown case.

Example: "I don't have a confirmed answer for [specific topic] in what
I have access to — rather than guess, let me connect you with someone who
can get you the right information." (The bracketed reasoning clause is the
addition — previously this was a generic non-specific statement.)

**Source:** Journal of Business Research, Vol. 180 (2024) — explainable-AI
post-hoc explanations softening negative reactions to failures.
```

**Insert into Module 3, Section 5 (Failure Handling)**, as a preamble before the specific failure-case list (CART API ERROR, BOOKING CONFLICT, etc.):

```markdown
**Universal reasoning requirement (applies to every case below):** Every
failure-handling response in this section includes a brief reason alongside
the fallback action — not just "here's what happens instead," but "here's
what happens instead, and here's why." This is already implicit in most of
the language below (e.g., "I wasn't able to add that directly — here's a
direct link"); this note makes it an explicit requirement for any future
failure case added to this section.

**Source:** Journal of Business Research, Vol. 180 (2024).
```

---

### Part A Completion

After applying A1, A2, A3:

1. Update Step 0A's own completion summary (or add a note if none exists inline) confirming the Universal Persona Rule was added.
2. Update Module 1 and Module 2's completion summaries noting the correction-path and reasoning additions.
3. Update Module 3's completion summary noting the reasoning requirement addition to Failure Handling.

**STOP after Part A. Report back. Do not proceed to Part B without confirmation.**

---

## PART B — P2 Batch (7 changes, minor/low-risk)

*Only begin this section after explicit confirmation that Part A is approved.*

### B1. Truthful Consequence Framing (P-003)

**Insert into Module 2, Objection Handling Flow (C), Timing subtype**, as an addition to the existing response rule:

```markdown
**Honest consequence framing (addition):** If a real, Business-Memory-
confirmed consequence exists (e.g., genuinely limited availability, a real
seasonal factor), the agent may state it plainly as part of the
save-for-later response. This is distinct from manufactured urgency
(Step 2 §2.2, Risk-Based Freedom Reduction) — the distinguishing test is
whether Business Memory actually confirms the claim. If it doesn't, the
agent does not state it, full stop.

**Source:** Kahneman & Tversky (1979); Ruggeri et al. (2020) — loss/risk
framing is more motivating than equivalent gain framing, when genuinely true.
```

### B2. Discovery Budget Footnote (P-004)

**Insert into Step 2, Section 2.3 (Discovery Budget Rule)**, as a footnote after the existing 3-check list:

```markdown
**Footnote — conversation length:** Weight check #2 ("has the customer
received value recently, or only given") more heavily as conversation
length increases. This is a soft precaution, not a hard rule — the
underlying research on decision fatigue is contested (magnitude disputed
in later replications) and does not justify a standalone detection
subsystem, only this lightweight adjustment to an existing check.
```

### B3. Light Post-Conversion Touch (P-012)

**Insert into Step 1G, End State 1 (Successful Completion)**, as an archetype-conditional addition:

```markdown
**Archetype-conditional reinforcement (addition):** For archetypes with
higher Relationship-Transaction weighting (Step 0A) — Consultation,
Engagement, Appointment — a successful completion may include a brief,
genuine closing note beyond the bare transactional confirmation (e.g.,
warmth appropriate to the relationship, not a scripted add-on). Skip for
Commerce and Emergency, where Transaction weighting dominates (70-80%)
and a bare confirmation is the correct, friction-free close.

**Source:** Court, Elzinga, Mulder & Vetvik (2009), McKinsey Consumer
Decision Journey — post-purchase experience feeds the next consideration
cycle, not just a satisfaction score.
```

### B4. Proportionate Remedy (P-033)

**Insert into Module 1, Complaint Handler**, in the "what agent can offer" section:

```markdown
**Proportionality note (addition):** Offered resolution should match the
severity of the issue as understood from the diagnosis step — do not
over-correct minor issues or under-correct significant ones, within held
action-level permissions (Step 1D.1).
```

### B5. Recovery Tone Calibration (P-036)

**Insert into Module 4, Section 4 (Recovery Message Logic)**, as a tone addition:

```markdown
**First-touch tone calibration (addition):** Step 1 of any recovery cadence
defaults to light/informational tone rather than urgency framing. A
majority of abandonment reflects genuine non-purchase intent, not lost
revenue (Baymard Institute research — most abandonment is "just browsing,
not ready"). Reserve any urgency framing (per B1's truthful-consequence
standard) for later cadence steps only, and only if a genuine constraint
exists.

**Source:** Baymard Institute meta-analysis, 50 studies.
```

### B6. Name Complexity as Escalation Rationale (P-042)

**Insert into Module 1, Sub-Flow D (Human Handoff Handler)**, as a clarifying note on existing triggers:

```markdown
**Underlying rationale (clarification, not new behavior):** The existing
escalation triggers (Low/Conflicting confidence, action-permission gaps)
are functionally task-complexity signals — research confirms complexity,
not channel or demographic preference, is what should drive human-handoff
decisions. This note names the existing behavior's rationale explicitly;
it does not change any trigger condition.

**Source:** Journal of Retailing and Consumer Services (2020).
```

### B7. Preventive Note Against Demographic Channel Assumptions (P-043)

**Insert as a new guidance note in Step 4's framework** (or wherever archetype-build guidance for future archetypes lives — Commerce/Appointment/Engagement/Consultation are still pending their full builds):

```markdown
**Design principle for all future archetype builds:** Never route channel
or escalation decisions based on assumed customer age/generation
preferences. Research (McKinsey 2024, 3,500-consumer survey) found no
reliable age-based phone-aversion pattern — Gen Z respondents were found
35-40% *more* likely to call for complex issues than older cohorts, driven
by issue complexity, not generational preference. Use task complexity
(per B6) as the routing signal, never demographic assumption.
```

### Part B Completion

After applying B1-B7:

1. Update each affected module/step's completion summary with a one-line note referencing the applied change.
2. Update `Architecture_Diff_Report_v1.md`'s status (if it lives in the repo) marking all 10 items as APPLIED.

STOP after Part B. Report back with full change list.
