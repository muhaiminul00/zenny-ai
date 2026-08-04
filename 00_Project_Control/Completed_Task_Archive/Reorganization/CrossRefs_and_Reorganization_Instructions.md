# Cross-Reference Additions + Project Reorganization — Task Instructions

```
Task:      Part 1 — Add 4 small cross-reference links to Agent_Runtime_System_v1.md
           Part 2 — Reorganize the project folder (junk cleanup + fold in
                    2 new folders: Architecture-Explorer, zenny-website)
Status:    Approved. Two related but distinct pieces of housekeeping.
Scope:     Part 1: Agent_Runtime_System_v1.md only, 4 tiny additions.
           Part 2: whole project folder structure.
```

---

## Part 1 — Cross-Reference Additions

These are the 4 links flagged (not made) during the Modular Archival task. Each is a single-line addition pointing to a newly-created artifact — no other content changes.

### 1. Step 1D.3 (Action Tool Execution Contract) → Tool Naming Convention

Insert as a closing note at the end of Step 1D.3, after its existing content:

```markdown
**Related:** For the naming standard every tool/webhook call follows
(verb-entity format, one action per tool), see
`06_Infrastructure/Tool_Naming_Convention.md`.
```

### 2. Module 3 §2.1 (Universal Availability Validation Layer) and §5 (Failure Handling) → Fallback Pattern Catalog

Insert as a closing note at the end of §2.1:

```markdown
**Related:** For the named A/B/C/D fallback pattern vocabulary these
checks and their fallback chains follow, see
`06_Infrastructure/Fallback_Pattern_Catalog.md`.
```

Insert as a closing note at the end of §5 (after the existing failure-case list, before whatever section follows):

```markdown
**Related:** These failure-handling cases follow the same Fallback
Pattern vocabulary (A/B/C/D) used system-wide — see
`06_Infrastructure/Fallback_Pattern_Catalog.md`.
```

### 3. Step 1C.0 (Runtime Configuration Resolver) → Client Onboarding Guide

Insert as a closing note at the end of Step 1C.0:

```markdown
**Related:** For the client-facing process that determines these
configuration values at deployment time, see
`00_Project_Control/Client_Onboarding_Guide.md`.
```

### 4. Appendix C or Step 6 → Version Control & KPI Framework

Insert at the top of Appendix C, as an introductory note before its existing content:

```markdown
**Related:** For the operational framework (version tracks, promotion
criteria, KPI measurement) that governs how changes to this document's
specifications get deployed and measured across live clients, see
`00_Project_Control/Version_Control_and_KPI_Framework.md`.
```

**Constraint:** These are the only 4 changes to `Agent_Runtime_System_v1.md` in this task. Do not touch anything else in the document.

---

## Part 2 — Project Reorganization

**Context:** The project folder structure was established in Task 1 (very first task of this entire build) and has accumulated files since — completed instruction/prompt files from every batch and phase, superseded intermediate documents, and 2 folders the architect added mid-project (`Architecture-Explorer`, `zenny-website`) that were never folded into the Task 1 hierarchy.

### Step 1 — Scan Everything First

Before moving or deleting anything, produce a full inventory:
```bash
find . -type f -not -path "./01_Strategy/Modular_Legacy/*" | sort
```
(Exclude Modular_Legacy since that's already organized from the prior task.)

Categorize every file found into:
- **Core deliverable** — belongs in the existing Task 1 hierarchy, stays
- **Completed task artifact** — an instructions/starting-prompt file from a batch or phase that has since completed (e.g., `Batch3_Round1_Instructions.md`) — candidate for archiving, not deleting
- **Superseded intermediate** — an early draft or version that was later replaced (e.g., an early flowchart PARTIAL stub if any raw copies remain outside the main flowchart folder)
- **Unclear** — flag for architect review rather than guessing

### Step 2 — Archive Completed Task Artifacts (Don't Delete)

Create a new folder: `00_Project_Control/Completed_Task_Archive/`

Move every completed instructions/starting-prompt file into it, organized by sub-folder matching the phase it belonged to:
```
00_Project_Control/Completed_Task_Archive/
  Batch1_Mermaid_Fix/
  Batch2_Research_Amendments/
  Batch3_Enterprise_Hardening/
  Step4_Archetype_Builds/
  Comprehensive_Scan/
  PreStep4_Cleanup/
  Modular_Archival/
  Reorganization/   (this task's own instructions/prompt files, once complete)
```

This preserves the full build history (useful for onboarding a new team member, or for audit purposes) without cluttering the active working folders.

**Do not archive:**
- `Agent_Runtime_System_v1.md`, `Stress_Test_Library_v1.md`, all 14 flowchart files — these are the live deliverables, stay in `02_Agent_Runtime_System/`
- `Architecture_Diff_Report_v1.md`, `Customer_Psychology_Principles_v1.md` — these are reference documents that inform future work, not completed one-off tasks
- The 4 newly-extracted artifacts from the Modular task
- `CLAUDE.md` — stays in root
- Anything still actively referenced by the live runtime document

### Step 3 — Fold In Architecture-Explorer and zenny-website

**Do not delete or restructure the internal contents of either folder** — they're working tools/sites the architect built for a specific purpose (Architecture-Explorer: an HTML review tool for navigating the large runtime doc and flowcharts; zenny-website: presumably a separate web asset). Your job is only to position them correctly within the existing root hierarchy, matching the numbering/naming convention already established by Task 1's original folders (`00_Project_Control`, `01_Strategy`, etc.) — without renaming what's inside them.

Suggested placement (use judgment, this is a suggestion not a mandate):
```
Architecture-Explorer → could become 07_Tools/Architecture-Explorer/
                         or stay at root if it's meant to be immediately
                         discoverable (it's a review tool for the whole
                         project, arguably deserves visibility)
zenny-website          → could become 07_Tools/zenny-website/ or
                         08_Product_Assets/zenny-website/ depending on
                         what it actually contains — inspect first
```

Inspect both folders' actual contents before deciding — if `zenny-website` turns out to be a client-facing product asset rather than an internal tool, it may deserve its own top-level number rather than living under a generic "Tools" folder. Report what you find and your placement reasoning.

### Step 4 — Clean Up Remaining Junk

For anything in Step 1's inventory categorized as "Superseded intermediate" — confirm it's genuinely superseded (the content it represented is now fully captured in a current deliverable) before archiving it the same way as Step 2 (into `Completed_Task_Archive/`, not deleted).

**Never delete anything in this task.** Everything either stays in its working location, or moves to `Completed_Task_Archive/` or `Modular_Legacy/`. Deletion is not part of this task's scope.

---

## Constraints

1. Do not touch `01_Strategy/Modular_Legacy/` — already organized, out of scope for this task.
2. Do not modify the contents of `Architecture-Explorer` or `zenny-website` beyond moving the folder itself — no internal restructuring.
3. Do not delete anything, anywhere, under any circumstance in this task.
4. If any file's categorization is genuinely unclear, flag it rather than guessing — same discipline as Task 1's original Needs_Review pattern.
5. Complete Part 1 first, confirm, then proceed to Part 2 — Part 2 is larger and benefits from Part 1 being cleanly closed first, but does not require a separate stop/confirmation unless you encounter something requiring architect judgment (per Constraint 4).

---

## Deliverable

1. Confirmation of all 4 cross-reference additions applied.
2. Full file inventory from Step 1, with categorization.
3. Confirmation of `Completed_Task_Archive/` structure and what was moved into it.
4. Confirmation of `Architecture-Explorer` and `zenny-website` placement, with your reasoning for where each landed.
5. List of anything flagged as "Unclear" requiring architect review.
6. Final project folder tree (top 2-3 levels) showing the resulting clean structure.

STOP after both parts are complete and the report is delivered.
