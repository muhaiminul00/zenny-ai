# Architecture Explorer Migration Report

Migration date: 2026-07-09

**2026-08-01 update:** `docs/Agent_Runtime_System_v1.md`, `docs/Stress_Test_Library_v1.md`, and `docs/Flowcharts/` were found to be badly stale during that date's cross-architecture validation pass — missing roughly half the canonical document's content (6,363 vs. 11,687 lines) and still referencing "Revenue Agent" after the canonical Runtime doc's Revenue→Growth Agent rename. All three have been re-copied from the canonical `02_Agent_Runtime_System/` source as of that date, `Revenue_Agent_Flow.md` was removed and replaced with the canonical `Growth_Agent_Flow.md`, and `update-flowchart-manifest.ps1` was re-run (14 diagrams registered). The migration record below, describing the original 2026-07-09 localStorage migration, is left as historical record and not rewritten.

## Migration boundary

The repository contained only `docs/Agent_Runtime_System_v1.md`. The older source document or a generated section dataset was not present, so a reliable old-to-new content diff could not be calculated. No section has been guessed as new, changed, renamed, moved, or deleted. Existing section IDs remain generated with the explorer's original slugging algorithm so stored review history continues to match wherever headings are unchanged.

The live browser value of `architecture-explorer:v1` is origin-specific and cannot be read from the repository. Before the updated explorer migrates that value, it creates a timestamped `architecture-explorer:v1:backup:<timestamp>` copy. The original key is retained. The dashboard can export the migrated live state as `progress_backup.json`.

## 1. Sections unchanged

- Undetermined (the prior Markdown source is unavailable).
- Exact existing section IDs are preserved at runtime.

## 2. Sections updated but progress preserved

- Undetermined (the prior Markdown source is unavailable).
- Review status, bookmarks, notes, timestamps, and reading position are retained for every stored ID that still exists.

## 3. New sections added

- None labelled automatically because there is no trustworthy old baseline.
- The explorer supports `NEW` and “New since last version” metadata once a baseline diff is available.

## 4. Bookmarks migrated successfully

- All bookmarks whose stored slug matches a current heading slug are preserved.
- Exact totals are shown after the user's browser state loads.

## 5. Bookmarks needing manual review

- Any stored bookmark ID that no longer matches a heading is retained in “Needs Review / Migrated bookmarks.”
- No orphaned bookmark is silently discarded.

## 6. Deleted or renamed sections detected

- Cannot be determined without the prior Markdown source.

## Flowchart migration

### Unchanged diagrams

- None: diagrams were not supported by the previous explorer.

### Updated diagrams

- None detectable: no earlier diagram baseline was present.

### New diagrams

- Appointment Archetype Flow
- Commerce Archetype Flow
- Consultation Archetype Flow
- Conversion Engine Flow
- Core Agent Flow
- Data Collection Map
- Email Manager Flow
- Emergency Archetype Flow
- Engagement Archetype Flow
- Escalation Map
- Recovery Engine Flow
- Revenue Agent Flow
- Service Routing Map
- Universal Runtime Flow

All 14 Mermaid files found under `docs/Flowcharts` are registered as editable Mermaid sources and initially labelled `NEW`. Flowchart viewed state is stored independently and is not reset when document progress changes.
