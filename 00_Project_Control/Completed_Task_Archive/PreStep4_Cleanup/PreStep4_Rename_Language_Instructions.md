# Pre-Step-4 Cleanup — Rename & Language Default

```
Task:      Two small, isolated changes before Step 4 archetype builds resume
Status:    Approved answers to the 2 open questions that block Step 4 work
Scope:     A global rename (mechanical, high line-count but low-risk) and
           one default-value decision (single line change)
```

---

## Item 1 — Rename "Revenue Agent" → "Growth Agent"

**Why:** "Revenue Agent" was used externally for marketing but causes confusion since it's the technical core module other modules attach to (Module 1 "Core Agent" is the always-on foundation; this module — Module 2 — is the discovery/recommendation/objection engine). Architect has approved **"Growth Agent"** as the new name.

**Scope of the rename:**
- Every occurrence of "Revenue Agent" throughout `Agent_Runtime_System_v1.md` → "Growth Agent"
- Every occurrence in `Stress_Test_Library_v1.md` → "Growth Agent"
- Every occurrence in the flowchart file `Revenue_Agent_Flow.md` → rename the file itself to `Growth_Agent_Flow.md`, and update all internal references to "Revenue Agent" within it to "Growth Agent"
- Every cross-reference to "Revenue_Agent_Flow.md" in other flowchart files (Service_Routing_Map.md, Universal_Runtime_Flow.md, Data_Collection_Map.md, Commerce_Archetype_Flow.md, Appointment_Archetype_Flow.md, Consultation_Archetype_Flow.md, Engagement_Archetype_Flow.md, Emergency_Archetype_Flow.md, Escalation_Map.md — wherever they link to it) → update to `Growth_Agent_Flow.md`
- Every reference in `Architecture_Diff_Report_v1.md` and `Customer_Psychology_Principles_v1.md` (Phase 2/3 documents) → "Growth Agent"

**What does NOT change:**
- "Module 2" as a numeric identifier stays the same — only the name "Revenue Agent" changes to "Growth Agent," not its position/numbering in the module sequence.
- Any conceptual meaning, section structure, or behavior — this is a pure find-and-replace of the term itself, not a redesign.
- References to "revenue" as a general business concept unrelated to the module name (e.g., if "revenue" appears describing a business outcome rather than naming the module) — use judgment, but the term "Revenue Agent" specifically (capitalized, as the module name) is what changes.

**Method:** Use a precise find-and-replace for the exact phrase "Revenue Agent" (case-sensitive, as a module name) rather than a blind global replace of the word "revenue" alone, to avoid accidentally changing unrelated uses of the word.

**Verification required:**
```bash
grep -rn "Revenue Agent" Agent_Runtime_System_v1.md Stress_Test_Library_v1.md \
  Architecture_Diff_Report_v1.md Customer_Psychology_Principles_v1.md \
  02_Agent_Runtime_System/Flowcharts/*.md
```
This should return **zero results** after the rename. Report the output.

Also confirm the file `Revenue_Agent_Flow.md` no longer exists and `Growth_Agent_Flow.md` exists in its place with identical content aside from the name change.

---

## Item 2 — Language Mode Default: Adaptive

**Why:** Architect decision — when a client doesn't specify `language_mode` in Business Config, the default is **adaptive** (agent detects and responds in the customer's language), not fixed.

**Update the placeholder added in Batch 3 Round 4**, in Step 1C ("What is loaded," language configuration section):

```markdown
BEFORE:
**Open item:** Default mode when a client doesn't specify (fixed vs.
adaptive) is not yet decided — flagged for architect confirmation.

AFTER:
**Default:** When a client's Business Config does not specify
`language_mode`, the runtime defaults to **adaptive** — the agent detects
the customer's language per message and responds in kind, within whatever
languages the business's Business Config/KB actually supports content in
(adaptive detection does not mean the agent can respond fluently in a
language it has no KB content for — it means it detects and matches
what the customer is using, among supported languages). A business
wanting to lock the agent to a single language regardless of customer
input must explicitly configure `language_mode: fixed`.
```

**Note:** The code-mixed-input detection mechanism (e.g., Bangla-English "Banglish") remains a genuinely unresolved implementation detail — this default-mode decision does not resolve that. Keep the existing note about code-mixing being a platform-layer (Voiceflow/Convocore NLU-dependent) concern, not fully specified in this document.

---

## Completion

1. Confirm Item 1's rename complete with zero-result grep verification.
2. Confirm Item 2's default-mode line updated exactly as specified.
3. Update relevant completion summaries (Module 2's own summary header, Step 1C's summary).

STOP after both items confirmed. This is a short, self-contained cleanup task — do not proceed to Step 4 archetype work under this same prompt. A separate starting prompt will follow for Step 4.
