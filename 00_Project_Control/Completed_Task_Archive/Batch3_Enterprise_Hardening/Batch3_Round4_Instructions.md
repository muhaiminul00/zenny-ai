# Batch 3 — Round 4 — Data Architecture & Cleanup

```
Task:      Memory roadmap clarification, database independence principle,
           email category/reply-mode additions, remaining cleanup items
Source:    Patches 7, 8, 9 (remainder), and 10 from the merged 10-patch
           structure, plus outstanding notes not yet addressed
Status:    Approved. Final round of Batch 3.
```

---

## Patch 8 — Memory Roadmap Clarification (Small)

**Why:** Confirms (does not change) an already-correct scoping decision. Step 0C already limits memory to Session/Customer/Business levels and defers "saved preferences" schema to a future Integration Contract revision. This patch makes explicit that Company Brain (Zeromanual's broader long-term-memory product direction) is a valid *future* backing store for Customer Memory (Level 2), without pulling that scope into current requirements.

**Insert into Step 0C, immediately after Level 2 (Customer Memory)'s existing definition, as a forward-looking note:**

```markdown
**Forward-looking note (not a current requirement):** Customer Memory
(Level 2) as defined above is intentionally scoped to session-bounded and
lightly-persisted customer history — sufficient for the current build.
A future architectural direction may back this level with a richer
long-term intelligence layer (Zeromanual's "Company Brain" concept:
long-term customer intelligence feeding recommendation and prediction).
This document does not require that integration now — Level 2's existing
definition, trust rules, and Memory Freshness Rules (§3.1) remain fully
sufficient and unchanged. When/if a richer backing store is adopted, it
replaces *what's behind* Level 2, not the rules governing how Level 2 is
used — those rules (source-authority priority, freshness windows, privacy
boundaries) apply identically regardless of what system stores the data.
```

---

## Patch 7 — Data Architecture Evolution Principle (Small — Principle Only, Same Discipline as Round 2)

**Why:** Parallel to Round 2's Platform Independence principle, but specific to the data layer. Establishes the Zenny Control Database vs. Client Data Layer distinction as a principle, without redesigning the current Airtable schema — that redesign (and the open question of Airtable's long-term feasibility) is a separate infrastructure decision, explicitly flagged as open, not resolved here.

**Insert as a new subsection immediately after the Implementation Independence principle added in Round 2:**

```markdown
### Data Architecture Principle: Control Plane vs. Client Data

Two distinct categories of data exist in this system, and they should
remain architecturally separate regardless of what database technology
implements them:

```
ZENNY CONTROL DATA:
  Business configurations, module activation states, permission grants,
  billing/account data — owned by Zenny/ZeroManual, shared infrastructure
  across all client deployments.

CLIENT DATA:
  Each business's own customers, leads, conversations, orders, recovery
  records — owned by and scoped to that specific client deployment.
```

**Principle:** Schema design matters. Database vendor does not. Whether
Control Data and Client Data are implemented as separate Airtable bases,
separate Postgres/Supabase schemas, or any other technology, the
architectural separation between "what Zenny needs to operate the
platform" and "what belongs to one client's business" must be
maintained — this prevents cross-client data leakage and keeps a future
technology migration (e.g., Airtable → Supabase) a implementation swap
rather than a data-model redesign.

**Open question, explicitly not resolved here:** Whether Airtable remains
viable at production scale (cost, row limits, multi-base management
overhead as client count grows) is a real infrastructure decision requiring
its own evaluation — not decided by this runtime document. This principle
ensures that whichever way that evaluation goes, the Control/Client data
separation transfers cleanly.
```

---

## Patch 9 (remainder) — Email Manager: Reply-Style Sub-Mode + Notification Filtering + Category Extensibility + Typo Correction

**Why:** Four related Email Manager gaps identified: (1) no distinction between scripted-template replies and fully-generative replies within an autonomy level, (2) no category for automated/notification emails (platform notifications, marketplace alerts) that should be filed, never replied to, (3) categories are described as a fixed list rather than explicitly business-config-extensible, (4) email validation catches malformed addresses but not plausible typos (missing letter in domain, wrong TLD) worth suggesting a correction for.

### Part 1 — Reply-Style Sub-Mode

**Insert into Module 5, Section 3 (Three Autonomy Levels), as a new subsection 3.2 (renumber the existing Learning Loop subsection if it's currently 3.1, to 3.3, to keep them in sequence — verify current numbering before inserting):**

```markdown
#### 3.2 Reply Style: Scripted vs. Generative

Within Level 2 (Draft for Approval) and Level 3 (Autonomous Reply), the
agent's reply is generated one of two ways — this is a configuration
choice per category, not a free choice the agent makes per email:

```
SCRIPTED REPLY:
  A pre-approved response template, filled with the specific details of
  this email (name, order number, etc.) but not generated freeform.
  Example: "We've received your complaint regarding [topic] — our team
  is reviewing it and will follow up within [timeframe]."
  Use case: High-volume, low-variance categories where consistency
  matters more than nuance (e.g., a standard complaint acknowledgment
  before human review, order-status confirmations).

GENERATIVE REPLY:
  A fully agent-composed response drawing on KB/Business Memory context,
  following all existing Module 5 rules (5-condition gate for Level 3,
  draft-then-approve for Level 2).
  Use case: Categories requiring specific, varied, context-dependent
  answers (Lead inquiries, Support questions with case-specific detail).
```

**Configuration:** Each customer-facing category (Lead, Support, Booking,
General, Partnership, Proposal — per §5) is configured with
`reply_style: scripted | generative`. Complaint and Refund remain
always-escalate regardless of this setting (§4, Conditions 3-4) — reply
style only applies to categories that reach the reply stage at all.
```

### Part 2 — Automated/Notification Category

**Insert into Module 5, Section 2.1 (Inbound Email Categorization), as an addition to the Enterprise Expansion category list (alongside the existing Vendor/Supplier, Media/Press, etc.):**

```markdown
  Automated/System Notification — inbound email from an automated sender
                          (platform notifications, ad-account alerts,
                          marketplace order notifications, subscription/
                          newsletter content the business itself
                          receives). Not from a customer. Never enters
                          reply logic at any autonomy level — filed/
                          organized only, same treatment as
                          Spam/Irrelevant, but tracked as a distinct
                          category since these are legitimate business
                          correspondence (e.g., a Meta ads billing
                          notification), just never reply-worthy.
                          Detection: automated-sender headers/patterns
                          (same detection mechanism already defined for
                          the EC-04 auto-reply-loop edge case in §8 — this
                          category formalizes that detection into a
                          named category rather than only an edge-case
                          handling note).
```

**Update the routing table in Section 5** to include this category in the "ALL LEVELS → Never enters customer-facing reply logic" group, alongside Vendor/Supplier, Job Application, Spam/Irrelevant, Internal/Misdirected.

### Part 3 — Category Extensibility

**Insert into Module 5, Section 2.1, as a closing note after the full category list:**

```markdown
**Category extensibility:** The category list above (both customer-facing
and operational sets) is the default configuration, not a fixed universal
constant. A client's category set is Business-Config-loaded and may be
extended with additional categories specific to that business's inbox
patterns, following the same customer-facing/operational split and the
same routing rules per autonomy level. New category requests are an
operational/account-management process, not a runtime behavior — the
runtime simply reads whatever category set the current Business Config
defines.
```

### Part 4 — Email Typo Correction

**Insert into Step 0B, Section 7.1 (Field Validation Rules), EMAIL ADDRESS subsection, as an addition after the existing invalid-format examples:**

```markdown
**Typo-correction suggestion (addition, distinct from format validation
above):** Beyond catching structurally invalid formats, the agent
recognizes common plausible typos and suggests a correction rather than
only flagging "invalid":
```
Common patterns to recognize:
  - Missing/extra character in a well-known domain (gmial.com, gmai.com
    → suggest gmail.com)
  - Common TLD typos (.con, .cmo → suggest .com)
  - Stray space within the address
  - Missing "@" where the intended structure is otherwise clear

Agent behavior: "That looks like it might be missing something —
did you mean [corrected version]?" — a specific suggested correction,
not just a generic "please re-check" prompt.
```
This is distinct from the fake-but-valid-format case (e.g., test@test.com)
accepted as an open gap in the Stress Test Library — that case has no
detectable typo to correct, since the format is fully valid. This addition
only handles cases where a real, identifiable typo exists.
```

---

## Patch 10 (remainder) — Final Cleanup Items

### Item 1: Confirm "STATUS: PENDING FULL STEP 4 BUILD" Flags Are Accurate, Not Stale

**Action:** Verify the 4 flowchart files (Commerce, Appointment, Engagement, Consultation) still accurately reflect "pending Step 4" status — i.e., confirm their Step 4 archetype builds genuinely have not been done yet (they should not have been done as a side effect of any Batch 3 round). If confirmed accurate, no change needed — this is a correct, intentional status marker, not a bug. Report confirmation either way.

### Item 2: Language Mode Architecture (Note 13)

**This item requires an answer to an open question before it can be built precisely — see the Open Questions note in the completion report below. Draft the structural placeholder now, full logic deferred.**

**Insert into Step 1C (Configuration Load), as an addition to "What is loaded":**

```markdown
**Language configuration (structural placeholder — full detection/response
logic pending architect decision on default mode):**
```
language_mode: fixed | adaptive
  fixed:     agent responds only in the business-configured language,
             regardless of what language the customer writes in.
  adaptive:  agent detects the customer's language per message (including
             code-mixed input, e.g., Bangla-English mixing) and responds
             in kind, within business-configured bounds (e.g., a business
             may support adaptive detection but only among 2-3
             configured languages, not fully open-ended).
```
**Open item:** Default mode when a client doesn't specify (fixed vs.
adaptive) is not yet decided — flagged for architect confirmation. Detection
mechanism for code-mixed input (e.g., Banglish) is a genuinely harder NLP
problem than single-language detection and is not fully specified here —
this section establishes the configuration structure only; the detection
implementation is a platform-layer concern (Voiceflow/Convocore NLU
capability-dependent) to be scoped separately.
```

---

### Round 4 Completion

1. Confirm all items applied: Patch 8 (memory roadmap note), Patch 7 (data architecture principle), Patch 9 remainder (4 Email Manager parts), Patch 10 remainder (flag confirmation + language placeholder).
2. Confirm no existing content was rewritten anywhere in this round — additions only.
3. Update all affected completion summaries (Step 0C, document header area, Module 5, Step 0B, Step 1).
4. Produce a final consolidated report: all of Batch 3 (Rounds 1-4) — every patch applied, every location, confirming Batch 3 is fully closed.

**STOP after Round 4. This closes Batch 3 entirely, pending final confirmation.**
