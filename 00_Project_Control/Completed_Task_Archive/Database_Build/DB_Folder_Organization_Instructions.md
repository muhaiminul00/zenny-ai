# Database Folder Organization — Task Instructions

```
Task:      Create a dedicated database folder, archive superseded drafts,
           promote the frozen v3 to the active location.
Status:    First task of a new session — read CLAUDE.md fully before
           starting, per standing project rules.
Scope:     Root-level database markdown files only.
```

---

## Context

Four database structure documents currently sit loose at project root from an iterative design process:
- `Database_Structure_Full_Draft_v1.md` (superseded)
- `Database_Structure_v2_Schema_Based.md` (superseded)
- `Database_Structure_v3_Delta.md` (superseded — delta-only document, fully merged into the frozen version)
- `Database_Structure_v3_FROZEN.md` (current, active, complete, self-contained source of truth)

---

## Task

1. **Create new folder:** `06_Infrastructure/Database/`
   (Sibling to the existing `06_Infrastructure/Airtable/`, `06_Infrastructure/n8n/`, `06_Infrastructure/Integration/` folders — same convention.)

2. **Create subfolder:** `06_Infrastructure/Database/Archive/`

3. **Move the 3 superseded drafts** (v1, v2, v3-delta) into `06_Infrastructure/Database/Archive/` — archive, do not delete, per the standing no-deletion rule used throughout this project.

4. **Move `Database_Structure_v3_FROZEN.md`** into `06_Infrastructure/Database/` (the parent folder, not Archive) as the active, current reference. Consider renaming it to `Database_Structure_v3.md` (dropping "_FROZEN" from the filename) now that it lives in a clearly-organized location — status is tracked inside the document's own header, not required in the filename. Use your judgment; report which you chose.

5. **Add a short README** to `06_Infrastructure/Database/`:
```markdown
# Database Structure

Active reference: `Database_Structure_v3.md` (or whatever filename was
chosen in step 4) — the frozen, complete, self-contained schema spec.
Status is tracked in the document's own header.

`Archive/` contains the superseded design-iteration drafts (v1 flat
model, v2 schema restructure, v3 delta) — kept for history, not for
reference. Use the active document only.
```

6. **Check for a natural cross-reference point.** If `06_Infrastructure/`'s own top-level README or index (if one exists) lists its contents, add an entry for the new `Database/` folder. If none exists, skip this — don't create a new index file speculatively.

---

## Constraints

1. Do not touch any other folder — this task is scoped to these 4 files and their new home only.
2. Do not modify the content of `Database_Structure_v3_FROZEN.md` in any way — rename the file if you choose to, but the content inside must be byte-identical to what it was before the move.
3. Do not touch `Modular_Legacy/`, `Completed_Task_Archive/`, or any other existing archive.

---

## Deliverable

1. Confirmation of the new folder structure.
2. Confirmation of what the active file was renamed to (if anything).
3. Confirmation the 3 superseded drafts are archived, not deleted.
4. Confirmation no other files were touched.

STOP after this task. Await a separate prompt for the SQL migration work.
