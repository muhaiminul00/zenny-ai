# Merge n8n Scan Files + Project Reorganization — Task Instructions

```
Task:      Part 1 — Merge 2 loose n8n scan files into one document
           Part 2 — Full project reorganization pass (junk cleanup after
                    the entire database build)
Status:    Approved. Isolated task — no n8n workflow design happens here.
```

---

## Part 1 — Merge the n8n Scan Files

Two files currently sit at project root:
- `n8n_Scan_and_Plan.md` (main scan findings)
- `n8n_Scan_Addendum_Platform_Independence.md` (the platform-independence layering addendum)

**Merge into one file:** `n8n_Scan_and_Plan_v1.md`, placed in a new folder (see Part 2 for where this and other loose files should land).

**How to merge — not a blind concatenation:**
- The addendum's "Platform Independence Layering" section should be integrated as its own major section in the merged doc, positioned right after the main scan's "Proposed n8n Folder/Workflow Structure" section (since the addendum directly revises that structure — readers should encounter the original proposal, then immediately see how it's revised, not read a separate bolted-on file).
- The addendum's re-framing of the 3 open design decisions should replace the main scan's original "3 open decisions" framing entirely (not appear twice) — the addendum's version is more precise (ties each decision to the Layer 1/Layer 2 split) and supersedes the original framing.
- **All 3 decisions are now RESOLVED** (per this conversation): Schema Resolver confirmed as-is, WAITING-state confirmed as sync-with-timeout, folder structure confirmed with the Layer 2 addition. Update the merged document to reflect this — the "Next Step" sections in both source files asking for confirmation should be replaced with a "Decisions — Resolved" section stating the 3 outcomes and brief reasoning for each (reuse the reasoning already given in this conversation, don't reinvent it).
- Keep everything else from both files — this is a merge, not a trim. The Voiceflow Build Standard rule-splitting analysis, the old-docs reusability findings, the hardcoded-pattern violations list — all of it carries forward.

**Delete the 2 original loose files after the merge is confirmed correct** (unlike database-phase tasks, this is a same-day merge of two just-created scratch files, not historical migration records — safe to remove the originals once the merge is verified, no archive needed for these two specifically).

---

## Part 2 — Full Project Reorganization

**Context:** The entire database build (Phases A, B, C, corrections, documentation, API reference, decisions history) generated many files across many sessions. This is the first full reorganization pass since the database work began — same discipline as the reorganization done after the runtime-architecture build completed.

### Step 1 — Full Inventory

```bash
find . -type f -not -path "./01_Strategy/Modular_Legacy/*" -not -path "./00_Project_Control/Completed_Task_Archive/*" | sort
```
(Excluding the two folders already properly organized from prior reorganization passes.)

Categorize every file found:
- **Core deliverable** — active reference, stays in its logical home
- **Completed task artifact** — an instructions/starting-prompt file from a now-finished phase — candidate for archiving
- **Superseded intermediate** — an early draft fully replaced by a later version
- **Unclear** — flag for architect review rather than guessing

### Step 2 — Database-Specific Organization

The database work generated its own significant file set. Based on what's been produced across this conversation, expect to find (verify against actual disk state, this is a reference list, not a guarantee of exact current filenames):
- Phase A/B/C instructions + starting prompts (multiple files)
- Correction task files
- `Database_Structure_v4_FINAL.md`
- `Database_API_Reference.md`
- `Supabase_MCP_Implementation_Notes.md`
- `Template_Migration_Process.md`
- `Client_Onboarding_Sequence_Spec.md` (from Phase C)
- `Database_Architecture_Decisions_History.md` (just created)
- The merged `n8n_Scan_and_Plan_v1.md` (from Part 1 of this task)

**Proposed organization:**
- Active/current reference docs → stay in or move to `06_Infrastructure/Database/` (already exists) — specifically: `Database_Structure_v4_FINAL.md`, `Database_API_Reference.md`, `Supabase_MCP_Implementation_Notes.md`, `Template_Migration_Process.md`, `Client_Onboarding_Sequence_Spec.md`, `Database_Architecture_Decisions_History.md`. Confirm these all actually live there already or move them if any are still loose at root.
- Completed task instructions/prompts (Phase A/B/C, corrections, documentation task) → archive into `00_Project_Control/Completed_Task_Archive/Database_Build/` (new subfolder, following the existing archive's established per-phase-subfolder pattern from the runtime-architecture reorganization).
- `n8n_Scan_and_Plan_v1.md` → new location, see Step 3.

### Step 3 — Create n8n Working Area

The n8n workflow design phase is starting next. Create:
```
06_Infrastructure/n8n/Planning/
```
(Sibling to the existing `06_Infrastructure/n8n/` folder, which already holds the old reference build guides.)

Move `n8n_Scan_and_Plan_v1.md` here — this becomes the working reference for the upcoming n8n build phase, kept clearly separate from the old (reference-only) n8n docs already in the parent folder.

### Step 4 — README Updates

Update or add README files where they already exist as a pattern (per the prior reorganization's established convention) to reflect the new Database_Build archive subfolder and the new n8n Planning folder — don't create new README files speculatively where the existing convention didn't already have one.

---

## Constraints

1. Never delete anything EXCEPT the 2 specific loose merge-source files in Part 1, and only after the merge is verified correct.
2. Do not touch `01_Strategy/Modular_Legacy/` or the existing `00_Project_Control/Completed_Task_Archive/` subfolders from before the database build (Batch1/2/3, Step4 builds, etc.) — those are already correctly organized from prior work.
3. Do not begin any actual n8n workflow design or building under this task.
4. If any file's disposition is genuinely unclear, flag it — same standard used throughout this entire project.

---

## Deliverable

1. Confirmation of the merge (Part 1), with the 2 original files removed after verification.
2. Full file inventory with categorization (Step 1).
3. Confirmation of database docs' final locations (Step 2).
4. Confirmation of the new `06_Infrastructure/n8n/Planning/` folder and the merged scan doc's placement (Step 3).
5. Any README updates made (Step 4).
6. List of anything flagged as unclear.
7. Final folder tree (top 2-3 levels) showing the resulting structure.

STOP after this task. Await a separate prompt to begin actual n8n workflow design.
