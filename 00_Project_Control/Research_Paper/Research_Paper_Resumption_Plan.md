# Research Paper — Resumption Planning Document
### Status: PAUSED. Resume after system implementation phase.

```
Purpose of this document: Let a future resumption of this task start
without re-deriving context from scratch, WITHOUT treating any decision
below as locked. Every choice is presented as a possibility space with
current leaning + reasoning — not a final decision.
```

---

## Why Paused, and Why That's a Reasonable Call

The system (`Agent_Runtime_System_v1.md`) is architecturally complete but has zero production deployment data. Implementing it (Voiceflow/n8n/Airtable build phase) is both more urgent business-wise and, as a side effect, **improves the eventual paper** — the current outline's own Limitations section admits "pre-production contribution, no measured outcomes." Coming back to this after real deployment data exists means the paper could include actual CSAT/conversion/resolution-rate evidence instead of only a design-stage methodology claim. That's a strictly stronger paper, not just a delayed one.

---

## What's Already Built (Reusable When Resuming)

| Asset | Status | Where |
|---|---|---|
| Phase 1 — 7-domain research synthesis, real sourced citations | Complete | `01_Strategy/Research/Customer_Psychology_Marketing_Research_v1.md` (active reference) |
| Phase 2 — 47 confidence-graded principle cards | Complete | `01_Strategy/Research/customer_psychology_principles_v1.md` |
| Phase 3 — Architecture diff (10 approved changes, applied) | Complete | `01_Strategy/Research/Architecture_Diff_Report_v1.md` |
| Related-work literature scan (today's session) | Complete, not yet fully exhaustive | This conversation — key finds below |
| Paper outline draft (8 sections + abstraction plan) | Drafted, unconfirmed | `Research_Paper_Outline.md` |

**Key related-work findings already surfaced** (re-verify currency when resuming, literature moves):
- Amershi et al. (2019), "Guidelines for Human-AI Interaction," CHI — closest prior art, must engage with directly
- Hevner et al. (2004) + Peffers et al. (2007) — Design Science Research methodology backbone
- Zimmerman, Forlizzi & Evenson (2007) — Research through Design, HCI-native methodology alternative
- Castelo, Bos & Lehmann (2019), *JMR* — task-dependent algorithm aversion
- "Gatekeeper aversion" in chatbot deployment (2025) — relevant to escalation/handoff design
- CASA-theory trust-after-failure literature (2024, 462-respondent study)
- Computational persuasion survey (2025) — grounds Cialdini application in HCI/NLP literature

---

## Open Decisions — Full Possibility Space

None of the following are final. Each shows options, tradeoffs, and current lean with reasoning — re-evaluate all of them when resuming, especially if circumstances have changed (e.g., a co-author becomes available, a specific venue deadline appears, production data exists by then).

---

### Decision 1 — Attribution: Named vs. Anonymized

| Option | Pros | Cons |
|---|---|---|
| **A. Fully attributed (company + product named throughout)** | Strongest credibility — "this is a real deployed system" claim lands harder; simpler to write, no genericizing pass needed | Locks out any venue requiring strict blind review without a rewrite pass; exposes company/product identity publicly the moment any preprint exists |
| **B. Written blind-compatible, de-anonymized at camera-ready** | Keeps optionality for venues requiring blind review during submission; standard, unremarkable practice | Slightly more careful writing throughout (avoid identity leaking through phrasing); one extra pass at each transition |
| **C. Fully anonymized permanently (never named, even post-acceptance)** | Maximum IP protection; avoids any competitive exposure | Significantly weakens the "this is real" credibility claim; unusual for a case-study paper specifically, since the case IS the evidence |

**Current lean: B**, functionally close to A (write naturally with real names, treat de-anonymization as a non-issue since a genericize pass is cheap) — reasoning was that blind review mainly matters for submission-time, not permanently, and (A)'s simplicity isn't worth losing the optionality.

**Re-check when resuming:** Has target venue been chosen yet? If a specific venue is now known, its actual review policy should drive this directly rather than staying abstract.

---

### Decision 2 — Architecture Abstraction Level

| Option | Pros | Cons |
|---|---|---|
| **A. Pattern-level only (no module names, no numeric thresholds, no verbatim content)** | Protects competitive IP fully; still allows a real, substantive case study | Some reviewers may find pattern-only descriptions less concrete/verifiable than they'd like |
| **B. Partial concrete detail (some real thresholds/names where low-risk, abstracted elsewhere)** | More vivid, more concrete, easier for reviewers to evaluate specificity | Risk of inconsistent redaction leaving the paper feeling arbitrarily gutted; harder to draw a clean, defensible line about what's "low-risk" |
| **C. Full transparency (architecture published openly, e.g., as supplementary material)** | Maximum reproducibility, strongest academic contribution by traditional standards | Gives away the actual product to competitors — direct conflict with "it's our secret" from the original framing of this task |

**Current lean: A**, unambiguously — this was explicit in the original framing ("we will not share the whole Agent_Runtime_System_v1.md... it's our secret"). Not really contested, but keeping it listed since B could tempt during actual drafting if a specific pattern seems "safe enough" to get concrete about — worth resisting that temptation consistently rather than case-by-case.

---

### Decision 3 — Target Venue Class

| Option | Pros | Cons |
|---|---|---|
| **A. Formal academic HCI venue (CHI/CSCW/IUI applied or industry track)** | Highest credibility, most durable, best for long-term positioning | Longest timeline, most rigorous review, may reject a no-outcome-data case study outright pre-deployment |
| **B. Workshop paper first** | Faster path to feedback and a citable draft, lower bar, good testing ground before a full submission | Less prestigious, sometimes not archival/citable the same way |
| **C. Industry/practitioner venue or well-placed preprint (arXiv-style)** | Fastest, reaches the audience most likely to actually use it (other builders), no blind-review friction | Lower academic credibility, doesn't "count" the same way for a formal publication record |
| **D. Two-track: practitioner piece now, academic submission after production data exists** | Gets value out sooner (marketing/credibility), keeps the academic option open and strengthened later | More total work — effectively two documents, two audiences, two levels of rigor |

**Current lean:** Academic/HCI was the explicit prior decision — but this was made *before* the "let's pause for implementation" decision, and that context has changed. **Worth genuinely re-deciding at resumption**, not just re-confirming — Option D may now be more attractive than it was, precisely because implementation is happening first and a practitioner piece could ship earlier without waiting for the full academic bar.

---

### Decision 4 — Methodology Framing

| Option | Pros | Cons |
|---|---|---|
| **A. Design Science Research (Hevner/Peffers) as primary** | Well-established in IS discipline, precise 6-activity structure maps cleanly onto what was actually done | Less native to an HCI-specific audience, who may be more familiar with RtD |
| **B. Research through Design (Zimmerman et al.) as primary** | HCI-native, better fit if targeting a pure HCI venue | Less rigid/structured than DSR, may read as less "systematic" for a methodology-heavy claim |
| **C. Both, DSR primary with RtD as explicit complement** | Covers both audiences, signals awareness of both traditions | Slightly more related-work space spent on methodology framing itself |

**Current lean: C** — no strong reason to abandon this, it's low-risk either way.

---

### Decision 5 — Case Study Selection (which patterns to feature)

6 candidates were proposed in the outline draft (discovery-sufficiency gate, AI-disclosure/persona calibration, tiered data collection, service-recovery-paradox audit, re-engagement cadence timing, complexity-based escalation routing) — chosen for outcome diversity (confirms/new/flag-audited) and defensibility under abstraction.

**Not re-litigated here in full** — but note explicitly: **by the time this resumes, the actual archetype builds (Commerce/Appointment/Engagement/Consultation) and comprehensive scan will have surfaced additional real examples** that didn't exist when this list was drafted (e.g., Engagement's passive-supporter-ownership resolution, Consultation's Discovery-Depth-Is-Enough construction). Re-survey the finished system for better/more illustrative examples before finalizing this list — the original 6 were chosen from a system that didn't yet have all 5 archetypes complete.

---

### Decision 6 — Authorship / Collaboration

*(New consideration, not in the original outline — worth adding to the possibility space.)*

| Option | Pros | Cons |
|---|---|---|
| **A. Solo/internal authorship (ZeroManual team only)** | Full control, no external dependency, fastest | No academic-insider credibility boost, may face more skepticism at review |
| **B. Bring in an academic co-author/collaborator** | Adds legitimacy, familiarity with venue norms/review process, possibly opens doors to a stronger venue | Requires finding the right person, dilutes control, adds coordination overhead and timeline risk |

**No current lean** — genuinely undecided, wasn't discussed yet. Worth a real conversation at resumption, not a default.

---

### Decision 7 — Standalone Release of the Principle Library (Phase 2)

| Option | Pros | Cons |
|---|---|---|
| **A. Keep Phase 2 (47 principles) as private input to the paper only** | No separate release overhead, keeps everything tied to the paper's timeline | Wastes a potentially valuable standalone resource — the principle library itself is useful independent of your specific architecture |
| **B. Release Phase 2 publicly as a standalone resource** (e.g., a GitHub repo, blog post, or citable dataset) independent of the paper's timeline | Builds goodwill/visibility in the practitioner community now, doesn't wait on the slower academic track, could itself get cited | Gives away work before the paper is out — a competitor could theoretically build on the same principle library |

**No current lean** — flagged as a future-work item in the outline's Conclusion, but not actually decided. Could be pursued independently of the paper's timeline if desired.

---

## When Resuming — Suggested First Steps

1. **Re-verify the related-work literature is still current** — don't assume today's search results are still the state of the art; this field moves fast (visible even in today's results, several sources dated within the current year).
2. **Re-decide Decision 3 (venue class) first** — it was made under different assumptions (before the "implement first" decision) and most other decisions cascade from it.
3. **Re-survey the finished system** for Decision 5's case-study examples — better material now exists than when the original 6 were drafted.
4. **Check whether any production data exists yet** — if the system has been live even briefly, the Limitations section and possibly the whole framing (design-stage vs. evaluated-outcomes contribution) should be revisited, since that's the single biggest lever on how strong this paper can be.
5. Only then return to the outline draft (`Research_Paper_Outline.md`) and treat it as a starting point to revise, not a finished plan to execute.

---

## Nothing in This Document Is a Commitment

This is a map of the decision space as it stood when the task was paused, not a plan to follow mechanically. Treat every "current lean" as a note about reasoning at the time, not a constraint on future judgment.
