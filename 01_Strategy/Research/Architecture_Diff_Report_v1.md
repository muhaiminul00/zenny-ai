# Architecture Diff Report v1
### Zenny Agent Runtime System — Phase 3

**Batch 2 Status: ALL 10 CHANGES APPLIED.** Applied to `Agent_Runtime_System_v1.md` in two parts — Part A (items #1–3, P0/P1, trust-critical) and Part B (items #4–10, P2, minor) — both confirmed and approved by architect. See the Consolidated Change List below for per-item Applied status.

Source: `Customer_Psychology_Principles_v1.md` (Phase 2, 47 principles) vs. the frozen `Agent_Runtime_System_v1.md`.

**Scope discipline:** Full diffs are done only for the 16 `NEW` and 1 `FLAG` principles from Phase 2 — the 28 `CONFIRMS` principles require no architecture action by definition. A small spot-check of 3 `CONFIRMS` principles is included to verify no weak implementation exists behind an apparent match. Total items reviewed: 20 of 47.

Diff format:
```
Principle | Current Architecture | Coverage | Recommended Change | Affected | Priority
```
Coverage: ✅ Covered · 🟡 Partial · 🔴 Missing
Priority: P0 (trust/safety-critical, cheap to fix) · P1 (meaningful, moderate cost) · P2 (minor/optional) · Closed (audited, no action) · Phase 5 (external materials only, not runtime)

---

## Domain 1 — Decision Psychology

### P-003 — Frame Around Real Risk/Loss When Honest
**Current:** Step 0C L3 and Module 2 Objection Handling already forbid fabrication and require KB-confirmed claims. No *positive* guidance exists for using honest consequence-framing when it's true and relevant.
**Coverage:** 🟡 Partial — the prohibition exists; the permission doesn't.
**Change:** Add one clarifying line to Module 2 Objection Handling (Timing subtype): "If a real, Business-Memory-confirmed consequence exists (e.g., limited availability), state it plainly — this is not the same as manufactured urgency (Step 2 §2.2)."
**Affected:** Module 2 Objection Handling (Timing)
**Priority:** P2

### P-004 — Don't Stack Decisions Late in Long Interactions
**Current:** Step 2 §2.3 Discovery Budget Rule already governs when to stop asking. Evidence behind this principle is contested (decision fatigue magnitude disputed, ego depletion failed replication).
**Coverage:** 🟡 Partial — mostly already covered by Discovery Budget Rule; the "late in a *long* conversation" nuance isn't explicit.
**Change:** Fold as a footnote into the existing Discovery Budget Rule rather than building a new "fatigue detection" subsystem — evidence is too weak to justify new infrastructure. One line: "Weight check #2 (has customer given without getting) more heavily as conversation length increases."
**Affected:** Step 2 §2.3 (footnote only)
**Priority:** P2 — explicitly reject building a standalone "fatigue signal" system; evidence doesn't support the engineering cost.

---

## Domain 2 — Intent & Buying Journey

### P-012 — Post-Purchase Experience Feeds the Next Consideration Cycle
**Current:** Module 4 Source H (Customer Reactivation) exists but is threshold-based and transactional (90/60/180/30-day triggers). No light-touch reinforcement happens immediately after a successful conversion.
**Coverage:** 🟡 Partial.
**Change:** For relationship-heavy archetypes only (Consultation, Engagement, Appointment — per their Step 0A Relationship-Transaction weighting), add an optional light closing note at Step 1G End State 1 (e.g., a brief genuine "glad this worked out" rather than a bare transactional confirmation). Skip for Commerce/Emergency where 70-80% weighting is Transaction.
**Affected:** Step 1G End State 1 (archetype-conditional), Module 4 Source H framing
**Priority:** P2

---

## Domain 3 — Trust Formation with AI

### P-015 — Give Users an Easy Correction Path
**Current:** Nothing explicit. Module 1 FAQ Handler and Module 2 Recommendation Flow deliver an answer/recommendation with no standing invitation to correct it.
**Coverage:** 🔴 Missing.
**Change:** Add a standing behavioral rule (prompt-level, not new state machine): after any FAQ answer or recommendation, the agent's phrasing implicitly or explicitly leaves room for correction ("does that match what you needed, or is something off?") rather than presenting the answer as final. This is copy/prompt guidance, not new architecture.
**Affected:** Module 1 FAQ Handler, Module 2 Recommendation Flow
**Priority:** P1 — low engineering cost, direct trust impact, evidence-backed (Dietvorst 2018).

### P-016 — Do Not Over-Anthropomorphize the Agent
**Current:** Nothing addresses this anywhere in the frozen document. Genuine gap — Step 0A defines tone/psychology per archetype but never addresses persona-humanness calibration or AI-disclosure.
**Coverage:** 🔴 Missing.
**Change:** Add a new cross-archetype rule (belongs near Step 0A's Employee Mindset framing, applies universally): the agent discloses it is an AI at the natural first-friction point (not necessarily the first message — forcing "I'm an AI" into every greeting is itself bad UX), and never claims human feelings, human experience, or a human identity. Warm tone is fine; false humanity is not.
**Affected:** Step 0A (new cross-archetype rule), Module 1 greeting/first-response behavior
**Priority:** P0 — trust-critical, evidence-backed, cheap (persona/prompt rule, not new subsystem). This is the single most important finding to come out of Phase 1-3.

### P-017 — Briefly Explain Reasoning Behind Recommendations and Failures
**Current:** Module 3 §5 Failure Handling and Module 1 FAQ Handler state *what* happened but not consistently *why*.
**Coverage:** 🔴 Missing.
**Change:** Add a "brief reasoning" requirement: when a recommendation is made, a failure occurs, or the agent says "I don't know," include one clause of reasoning rather than a bare statement. Example already exists implicitly in Module 2 Recommendation Flow's "tie recommendation to what customer said" — extend the same pattern to failures/unknowns.
**Affected:** Module 3 §5 Failure Handling, Module 1 FAQ Handler "I don't know" language
**Priority:** P1

---

## Domain 5 — Complaint & Service Recovery

### P-030 — Do Not Rely on the "Service Recovery Paradox" (FLAG — audit item)
**Audit result:** Reviewed Module 1 Complaint Handler in full. No language anywhere implies recovery produces *more* loyalty than avoiding the failure — the module's framing is procedural/neutral ("resolve, confirm satisfaction") with no "this is a loyalty opportunity" language.
**Coverage:** ✅ Covered — audit passed, no contradiction found.
**Change:** None required.
**Priority:** Closed.

### P-033 — Remedy Should Be Proportionate, Not Maximal
**Current:** Module 1 Complaint Handler defines what the agent can/cannot offer (action-level permission gated) but doesn't explicitly address matching remedy weight to issue severity.
**Coverage:** 🟡 Partial.
**Change:** Add one clarifying line to "what agent can offer" section: "Offered resolution should match the severity of the issue as understood — do not over-correct minor issues or under-correct significant ones, within held permissions."
**Affected:** Module 1 Complaint Handler
**Priority:** P2

---

## Domain 6 — Follow-up & Recovery

### P-036 — Most Abandonment Is Non-Buying Browsing — Don't Over-Recover
**Current:** Module 4 §4 Recovery Message Logic requires referencing real context but doesn't address tone calibration by abandonment-probability.
**Coverage:** 🟡 Partial.
**Change:** Add a tone note to Module 4 §4: first-touch recovery messages (Step 1 of any cadence) should default to light/informational tone rather than urgency framing, since a majority of abandonment was never going to convert (Baymard). Reserve any urgency framing for later steps only if a genuine constraint exists.
**Affected:** Module 4 §4 Recovery Message Logic
**Priority:** P2

### P-039 — "Speed to Lead" Multipliers Are Overstated (Client-Materials Only)
**Current:** Runtime behavior already correct (Step 1D routes Intent 03 immediately). This principle is entirely about external claims hygiene, not runtime behavior.
**Coverage:** N/A — not a runtime gap.
**Change:** None to architecture. Route to Phase 5 Client-Facing Summary: do not cite "100x"/"5-minute" multipliers as settled fact in sales materials.
**Priority:** Phase 5 only.

---

## Domain 7 — Channel Psychology

### P-042 — Route by Task Complexity, Not Channel Preference Alone
**Current:** Module 1 Human Handoff Handler escalates on Low/Conflicting confidence and permission gaps — which functionally already captures "complexity" as a signal, just not under that name.
**Coverage:** 🟡 Partial — mostly a naming/rationale clarification of existing behavior, not a new capability.
**Change:** Add one line naming task-complexity explicitly as the underlying rationale for existing escalation triggers, so builders understand *why* Low Confidence escalates rather than treating it as an arbitrary threshold.
**Affected:** Module 1 Human Handoff Handler (documentation clarification)
**Priority:** P2

### P-043 — Generational Phone-Aversion Assumptions Are Wrong
**Current:** Nowhere in the architecture does any rule assume age-based channel routing — this was never built, so there's nothing to be wrong about.
**Coverage:** ✅ Covered by omission — no contradicting logic exists.
**Change:** Add a preventive design-principle note (not a runtime rule) to prevent *future* builders from introducing age-based channel logic during Step 4 archetype builds.
**Affected:** CLAUDE.md-equivalent builder guidance note
**Priority:** P2 — documentation-only, prevents future drift.

### P-047 — Don't Cite Unverifiable SMS Statistics (Client-Materials Only)
**Coverage:** N/A — not a runtime gap.
**Change:** None to architecture. Route to Phase 5.
**Priority:** Phase 5 only.

---

## Spot-Check: CONFIRMS Principles (weak-implementation check)

Three `CONFIRMS` principles checked for hidden gaps behind an apparent match:

**P-020/P-028 (Privacy/Personalization boundaries):** Checked against Step 0C Privacy Boundaries in full. No weakness found — the existing prohibition on frequency/count data is more specific and stricter than the research requires. Closed.

**P-041 (Message frequency caps):** Checked against Module 4 §6 Stop Condition Enforcement. No weakness — max-step caps are already hard-enforced per archetype. Closed.

**P-044 (Context preservation across hand-offs):** Checked against Module 1 Human Handoff Handler and Module 5 §2.7. No weakness — `conversation_summary` and intent history transfer is already required at every hand-off point. Closed.

No hidden gaps surfaced in the spot-check.

---

## Consolidated Change List

**Deliberately lean — this reflects that 28/47 principles (60%) already confirmed the existing architecture without needing changes. That is the expected, correct outcome of a well-built system meeting real research, not a sign the diff was too shallow.**

| # | Principle | Change | Affected | Priority | Applied |
|---|---|---|---|---|---|
| 1 | P-016 | AI-disclosure + anti-anthropomorphism rule | Step 0A (new cross-archetype rule) | **P0** | ✅ Part A |
| 2 | P-015 | Easy correction path after answers/recommendations | Module 1 FAQ Handler, Module 2 Recommendation Flow | P1 | ✅ Part A |
| 3 | P-017 | Brief reasoning on failures/unknowns | Module 3 §5, Module 1 FAQ Handler | P1 | ✅ Part A |
| 4 | P-003 | Truthful consequence framing clarification | Module 2 Objection Handling (Timing) | P2 | ✅ Part B |
| 5 | P-004 | Fold into existing Discovery Budget Rule (footnote) | Step 2 §2.3 | P2 | ✅ Part B |
| 6 | P-012 | Light post-conversion touch, relationship archetypes only | Step 1G End State 1, Module 4 Source H | P2 | ✅ Part B |
| 7 | P-033 | Proportionate remedy clarification | Module 1 Complaint Handler | P2 | ✅ Part B |
| 8 | P-036 | Soften first-touch recovery tone | Module 4 §4 | P2 | ✅ Part B |
| 9 | P-042 | Name complexity as escalation rationale | Module 1 Human Handoff Handler | P2 | ✅ Part B |
| 10 | P-043 | Preventive note against demographic channel assumptions | Builder guidance | P2 | ✅ Part B |

**Total: 10 changes** (1 P0, 2 P1, 7 P2) — well within a sane amendment scope for a frozen architecture. **All 10 of 10 applied.**

**Closed, no action:** P-030 (audited, passed)
**Spot-check, no action:** P-020/P-028, P-041, P-044
**Phase 5 only, not runtime:** P-039, P-047

---

## Recommendation

**Phase 4 scope:** Only items #1-3 (P0 + P1) justify a Claude Code prompt on their own — they're the ones with real trust/behavior impact. Items #4-10 (P2) are small enough to batch into a single "Phase 3 Principle Refinements" prompt rather than seven separate amendment cycles.

**What I will NOT recommend:** Building new subsystems (context-freshness engines, channel-preference-memory schemas, narrative-progression state machines) for principles whose research backing is vendor-data or extension-of-theory rather than the strongest evidence tier. Several of those ideas aren't wrong, but they don't currently have research strong enough to justify reopening frozen architecture for new infrastructure — they're P2-or-lower candidates for a future cycle, not this one.

Ready to draft the Phase 4 prompts (P0+P1 first, P2 batch second) whenever you approve this list.
