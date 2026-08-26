# project-memory plugin — portable three-layer memory system

A standalone, installable Claude Code plugin (BC-TOOL-003, 2026-08-26)
extracting the same three-layer memory model this Wiki already implements —
current-state doc + durable cross-referenced Wiki + append-only log — into a
portable, self-scaffolding form usable in any project. **Zenny does not run
on it** — per explicit human decision, it was built first, migration decided
later (see [[reference/role-modes-plugin]] for the sibling plugin Zenny
*does* run on, which took the opposite path).

- **Location:** `github.com/muhaiminul00/project-memory`, sibling repo to
  `role-modes-plugin`, same author/conventions. Pushed via real `git push`
  from the start (not GitHub's web upload UI), specifically to avoid
  repeating the dotfile-drop defect `role-modes-plugin` hit — confirmed via
  a live `get_file_contents` listing that `.claude-plugin/`,
  `.codex-plugin/`, `.cursor-plugin/`, `.gitignore` all made it to the
  remote intact.
- **Conceptual origin:** [Karpathy's LLM-wiki-as-personal-knowledge-base
  gist](https://gist.github.com/442a6bf555914893e9891c11519de94f) — the
  pattern Zenny's own Wiki already independently converged on (an LLM
  incrementally builds/maintains a cross-referenced wiki rather than
  re-deriving answers from raw sources each time; Ingest/Query/Lint
  workflows; index.md + log.md navigation). Confirmed by fetching and
  reading the gist directly before building, not assumed from memory.
- **What it does:** a `SessionStart` hook (plain Node.js, same
  cross-platform convention as `role-modes`) that, on first run in a
  project, scaffolds whichever of `PROJECT_STATE.md` / `Wiki/index.md` /
  `Wiki/log.md` don't already exist — **existence-checked per file,
  never overwrites, merges, or deletes** — and once, sentinel-gated,
  appends a starter block to that project's CLAUDE.md. Four slash commands
  encode the gist's workflows generically: `/memory-log` (append),
  `/memory-promote` (Ingest — write/update a Wiki page + index
  cross-reference), `/memory-lint` (Lint — contradiction/orphan/stale-claim
  health check), `/memory-init` (repair/re-scaffold).
- **Deliberately out of scope for v1:** Build Card generation (stays a
  `role-modes`/consuming-project concern); a machine-parsed config file for
  overriding the default file names (same v1 cut `role-modes` made for its
  own fallbacks — a project names its own state-doc/Wiki paths in its own
  CLAUDE.md instead, read as fallback prose, not parsed).
- **Review pass:** built, then run through `/simplify` (4 parallel angle
  reviews) before the initial commit. Fixed: the one-time CLAUDE.md seed now
  uses its own dedicated sentinel instead of sharing the memory-files
  scaffold's sentinel (a CLAUDE.md-seed failure now retries independently,
  matching `role-modes`'s `seedClaudeMd` being fully self-contained); the
  per-session injected context no longer duplicates the full Promotion Rule
  text that also lives in the seeded CLAUDE.md block; the three scaffold
  templates consolidated into one `template()` helper; a duplicate
  `WIKI_DIR` mkdir removed; `memory-init.md` no longer pointed at
  hook-internal JS the command itself can't read. Skipped, not silently:
  automated CLAUDE.md-prose parsing for alternate file names (fragile
  heuristic — `/memory-init` already does this properly since a human
  reviews its output); a config-file override (explicit v1 cut).
- **Live-verified, not just installed-and-trusted:** ran the actual hook
  directly against disposable scratch projects (not Zenny — migration is
  deferred, nothing should touch Zenny's real Wiki yet). Confirmed: (1) a
  fresh project gets all three files + the CLAUDE.md block; (2) a second run
  is a byte-identical no-op (hash-compared); (3) a project with pre-existing
  `PROJECT_STATE.md`/`Wiki/index.md` keeps both untouched byte-for-byte and
  only creates the genuinely-missing `Wiki/log.md`, with the CLAUDE.md
  starter block appended after the existing content, not replacing it. A
  cosmetic gap found during this same verification (scaffold templates
  missing a blank line before the "(Scaffolded by...)" note) was fixed and
  pushed as a follow-up commit.
- **Real bug found live-verifying the actual install (2026-08-26,
  post-install):** human installed both `project-memory` and `role-modes`
  together in a real test project (`E:\Programming\claude-memory-test`) and
  asked for independent verification. Ran both plugins' real cached
  `hooks/session-start.js` against that project directly (not just trusted
  the CLI's install success) — `project-memory` scaffolded correctly
  (all 3 files + CLAUDE.md block, idempotent re-run hash-confirmed), but
  **`role-modes`'s own CLAUDE.md block never appeared** — both plugins had
  independently chosen the identical generic sentinel filename
  `.claude-md-seeded` in the shared `.claude/hooks/state/` directory;
  whichever plugin's hook fires first "claims" it, so the other silently
  skips seeding, believing it already ran. This is a class of bug the
  original single-plugin scratch-test verification structurally could not
  catch (no second plugin present to collide with) — only surfaced testing
  both together, exactly as the human asked. **Fixed:** `project-memory`'s
  sentinel renamed to `.project-memory-claude-md-seeded` (namespaced),
  pushed (`13a4933`), re-verified in a fresh scratch project with both
  hooks run in sequence — both blocks now appear correctly. The real test
  project's own stale `.claude-md-seeded` (written by the old code during
  this verification pass, before the fix) was deleted so `role-modes` can
  seed correctly on its next real run there.
- **Still human action required:** the already-installed plugin cache
  (`~/.claude/plugins/cache/project-memory/`) still runs the pre-fix code —
  a `git push` doesn't retroactively update an already-cloned local plugin
  cache. The human needs to update/reinstall `project-memory` to pull
  `13a4933` before this fix takes effect in any already-installed project.

- **BC-TOOL-004 update (2026-08-26), per human's 13-point feedback pass:**
  the CLAUDE.md seed target moved from a project's root `CLAUDE.md` to
  `.claude/CLAUDE.md` (same rationale as the sibling `role-modes` plugin —
  plugin/tool instructions stay separate from a project's own maintained
  docs). Per explicit human decision this session, the scaffolded files
  themselves (`PROJECT_STATE.md`, `Wiki/`) stay visible at the project
  root rather than moving into a hidden `.project-memory/` folder — each
  file's own footer note ("Scaffolded by the `project-memory` plugin...")
  already marks plugin ownership, which was judged sufficient. Also
  strengthened this session: the injected per-session context and the
  seeded block now push self-maintenance as the default — Claude is
  expected to apply the Promotion Rule on its own, as part of normal work,
  not wait for a human to invoke `/memory-log`/`/memory-promote`/
  `/memory-lint` explicitly (those are now framed as the manual fallback).
  README rewritten for honesty (real origin story, what/why/how, no
  inflated claims). Live-verified fresh + idempotent (hash-compared) +
  root-CLAUDE.md-never-touched + alongside `role-modes` in one scratch
  project (both `.claude/CLAUDE.md` blocks present, no sentinel collision).
  Pushed `dd808fa`.

- **BC-TOOL-007 update (2026-08-26), fixing a real bug found via live testing
  of the actual install:** the human installed both plugins fresh in a new
  project (project scope) and reported nothing got scaffolded at all. Root
  cause, confirmed against Claude Code's own docs: there is no
  `PluginInstalled`/`PluginEnabled` hook - `SessionStart` at the next real
  session boundary is the only mechanism, and `/plugin install` mid-session
  never fires one. Not a plugin bug; fixed the `SessionStart` matcher from
  `startup|resume|compact` to add `clear|fork` (catches `/clear`, a common
  real restart path this project misses too) and added an explicit README
  caveat instead of implying instant activation. Separately, per the
  human's follow-up instruction, reversed the BC-TOOL-004 "keep at root"
  decision: `PROJECT_STATE.md`/`Wiki/` now scaffold under `.project-memory/`
  (matching the `remember` plugin's own `.remember/` convention). This
  required also fixing a self-inflicted bug caught by `/simplify`'s
  altitude review before commit: the scaffold sentinel wasn't renamed
  alongside the path move, so an already-scaffolded project would have
  silently skipped re-scaffolding under the new layout - same class of bug
  as the earlier sentinel-collision fix, generalized here (sentinel must
  version with the artifact set it gates). Sentinel renamed
  `.memory-scaffolded` -> `.memory-scaffolded-v2`. Also added explicit
  named credit to Andrej Karpathy's gist in the README (inspired-by, not a
  fork). Live-verified: fresh scaffold, idempotent re-run, an old-sentinel
  project correctly re-scaffolding under the new layout with its stale
  root file left untouched, and a joint run alongside `role-modes`. Pushed
  `7fccc78`.

See [[reference/role-modes-plugin]] for the sibling mode-system plugin and
its own extraction/migration history.
