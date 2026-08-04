# Comprehensive Document Scan — Task Instructions

```
Task:      Full consistency audit of Agent_Runtime_System_v1.md and its
           companion documents, following completion of all 5 archetype
           Step 4 builds.
Status:    Approved. This is a QA/audit pass — it finds and fixes
           inconsistencies, it does not add new architecture.
Scope:     Agent_Runtime_System_v1.md, Stress_Test_Library_v1.md, all 14
           flowchart files, Appendix A/B/C, Architecture_Diff_Report_v1.md,
           Customer_Psychology_Principles_v1.md
```

---

## Why This Exists

Across Batches 1-3 and all 5 archetype builds, this document was edited in dozens of separate passes by separate prompts. Twice already, small inconsistencies slipped through: Batch 3 Round 4 left two stale cross-references in Module 5's own completion summary after a renumbering, and `language_mode` was referenced in Step 1C but never actually added to Appendix A until a later fix caught it. Both were caught by chance, not by systematic checking. This scan is the systematic check — the standing rule going forward, per architect instruction, is that a scan like this runs after any major multi-pass phase completes.

This is **not** a content-design task. Do not add new rules, resolve open architectural questions, or build anything new. If the scan surfaces something that looks like a missing *design decision* (not a consistency bug), flag it in the final report rather than resolving it inline — same discipline as DV-02 and every other deferred item throughout this build.

---

## Scan Categories

Work through these in order. For each, fix what you find (consistency bugs only) and log everything in a running changelog.

### 1. Cross-Reference Accuracy

Every "see Section X," "per Step Y," "reference Module Z §N" throughout the document should point to a section that actually exists at that number/name. Given the volume of renumbering across Batch 3 (1C.0, 1D.0.5, 1D.3 insertions) and 5 archetype builds, this is the highest-risk category.

```bash
# Suggested approach: extract every cross-reference pattern
grep -noE '(Step [0-9A-Z]+(\.[0-9]+)*|Module [0-9]+ §[0-9.]+|§[0-9.]+|Section [0-9.]+)' Agent_Runtime_System_v1.md
```
For each unique reference found, confirm the target actually exists at that exact number. Report any broken references and fix them (update the reference to the correct current location — do not renumber the target to match a stale reference).

### 2. Appendix Completeness

Every config flag, field name, or system requirement mentioned in the document body should have a corresponding entry in Appendix A (Integration Contract v2 Requirements), Appendix B (Step 4 Architecture Flags), or Appendix C (Cross-Cutting Future Task Tracking / consolidated gap list).

```bash
# Find every snake_case config-flag-looking token in the body
grep -noE '`[a-z_]+_(enabled|mode|threshold|list|flag)`' Agent_Runtime_System_v1.md
```
Cross-check each against Appendix A. Given the pattern already found once (`language_mode` missing), assume there are likely more — this category should get real scrutiny, not a light pass.

### 3. Terminology Consistency

```bash
grep -n "Revenue Agent" Agent_Runtime_System_v1.md Stress_Test_Library_v1.md \
  Architecture_Diff_Report_v1.md Customer_Psychology_Principles_v1.md \
  02_Agent_Runtime_System/Flowcharts/*.md
```
Should return zero results (confirmed clean as of the rename task, but re-verify now that 4 more archetype builds have happened since — confirm none of them accidentally reintroduced the old name). Also check for any other naming drift: inconsistent capitalization of module names, inconsistent archetype naming (e.g., "Consultation" vs "Consulting"), inconsistent use of "Growth Agent" vs "Module 2" (both are fine individually, but check they're not conflated confusingly in any one section).

### 4. Completion Summary Accuracy

For every section/module/archetype with a "COMPLETION SUMMARY" block, spot-check that the summary's claims (what was added, what was resolved) actually match what's currently in that section — completion summaries were written progressively across many passes and could describe an earlier draft state rather than the final one, especially anywhere a later round modified something a summary already described.

Priority check: Step 1's completion summary (touched across Batch 3 Rounds 1, 2, 4, plus the language config fix) and Module 5's (touched across Batch 2, Batch 3 Round 4's renumbering) — these have the most edit history and highest risk of drift.

### 5. Duplicate or Orphaned Content

Check for:
- Any section that appears to have been written twice (e.g., a placeholder that should have been fully replaced but left a fragment behind)
- Any section referenced by a completion summary or cross-reference that no longer exists
- The Batch 3 Round 4 language configuration replacement specifically — confirm exactly one language configuration block exists, not a duplicate (this was explicitly verified once already; re-confirm it's still true after the archetype builds, which may have added their own language-adjacent content)

### 6. Flowchart-to-Document Sync

For each of the 14 flowchart files, spot-check that the flowchart's content still accurately reflects the current state of its corresponding document section — particularly the 4 flowcharts rebuilt during archetype builds (Commerce, Appointment, Engagement, Consultation) and the ones from Batch 1/3 that referenced sections which have since changed (Universal_Runtime_Flow.md referencing Step 1's now-multiply-amended sections; Escalation_Map.md referencing Module 1's Escalation Priority Classification).

Re-run full Mermaid validation on all 14 files regardless of whether content changes are made, using the same Node/JSDOM method as previous passes:

```javascript
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
async function main() {
  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({ startOnLoad: false });
  const files = fs.readdirSync('mermaid_test').filter(f => f.endsWith('.mmd'));
  for (const f of files) {
    const content = fs.readFileSync(path.join('mermaid_test', f), 'utf8');
    try { await mermaid.parse(content); console.log(`PASS: ${f}`); }
    catch (e) { console.log(`FAIL: ${f}`); console.log(`  ${e.message.split('\n').slice(0,3).join(' | ')}`); }
  }
}
main();
```

### 7. Consolidated Gap List Triage (Appendix C's 25 Items)

Work through the 25-item gap list delivered at the end of the Consultation build. For each item, classify as:
- **CONSISTENCY BUG** — fix now, as part of this scan
- **DESIGN DECISION NEEDED** — do not resolve here, keep flagged, note if it needs architect input before the eventual comprehensive build phase
- **ALREADY RESOLVED, JUST NEEDS CROSS-REFERENCE** — the item Claude Code itself flagged as "possibly already resolved but uncross-referenced" (the language-mismatch item) is the specific case to check first. If Batch 3's language config work (adaptive-bounded, mode+list) already answers this, fix the cross-reference so Appendix C points to Step 1C's language configuration section rather than remaining listed as an open gap.

Report the triage breakdown (how many of the 25 fall into each category) in the final summary.

---

## Constraints

1. This is a fix-consistency-bugs pass, not a redesign pass. If you find yourself wanting to add new content beyond fixing a broken reference, filling a genuinely missing Appendix entry, or correcting a stale summary — stop and flag it as a design question instead.
2. Do not touch `/Modular` — this scan's scope is explicitly limited to the files listed at the top of this document. Modular folder review is a separate, upcoming task.
3. Do not reorganize the project folder structure, rename other folders, or touch `Architecture-Explorer` or `zenny-website` — that's also a separate upcoming task.
4. Every fix should be logged in a changelog with: what was wrong, where, what was changed.

---

## Deliverable

1. Full changelog of every fix made, organized by the 7 scan categories above.
2. Confirmation of cross-reference accuracy (or list of remaining broken references if any couldn't be confidently resolved).
3. Confirmation of Appendix completeness (or list of any newly-discovered missing entries, now added).
4. Confirmation zero "Revenue Agent" instances remain anywhere.
5. Confirmation all completion summaries spot-checked (priority: Step 1, Module 5) match current content.
6. Confirmation no duplicate/orphaned content found (or list of what was found and removed).
7. Full 14-file Mermaid re-validation, confirming PASS.
8. Triage breakdown of the 25-item Appendix C gap list (bug-fixed / design-decision-flagged / cross-reference-corrected counts).

STOP after the scan is complete and the report is delivered. Do not begin Modular folder review or project reorganization under this prompt — those are separate tasks awaiting their own starting prompts.
