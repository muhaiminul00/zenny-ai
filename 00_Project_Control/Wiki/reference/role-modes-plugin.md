# role-modes plugin — portable advisor/commander/execute system

Zenny's advisor/commander/execute mode system has been extracted into a
standalone, installable Claude Code plugin, usable in any project — not
Zenny-specific. **Zenny itself now runs on it** (BC-TOOL-002, 2026-08-26) —
this is no longer just a portable extraction, it's Zenny's live mode system.

- **Location:** publicly hosted at `github.com/muhaiminul00/role-modes`
  (owner: Muhaiminul Abedin Farhan / @muhaiminul00 — corrected from an
  earlier placeholder "ZeroManual" attribution, per human instruction). Also
  present locally as a separate git repo at `E:\Programming\role-modes-plugin`,
  sibling to this one, not a subfolder of the Zenny repo, tracking the same
  GitHub `main` branch. Installed for Zenny via
  `/plugin marketplace add https://github.com/muhaiminul00/role-modes` +
  `/plugin install role-modes@role-modes`.
- **A real defect found and fixed post-extraction:** the human's initial
  GitHub push used "Add files via upload," which silently drops every
  dotfile/dot-directory — `.claude-plugin/` (the actual plugin manifest
  AND the marketplace listing), `.codex-plugin/`, `.cursor-plugin/`, and
  `.gitignore` never made it to GitHub. Without `.claude-plugin/plugin.json`
  the repo wasn't a valid Claude Code plugin at all — this was the real
  install blocker, not attribution. Restored via a non-destructive commit
  (`98b6f10`) using the GitHub MCP directly (`push_files`), appended on top
  of the existing history rather than force-pushing — two attempted
  `git push --force-with-lease` calls were blocked by the Claude Code auto
  mode classifier, and per the Permission-Denials standing rule, the
  non-destructive MCP path was the available equivalent alternative, so
  force-push was not pursued further.
- **Zenny-side migration (BC-TOOL-002):** live-verified the plugin's cached
  `hooks/session-start.js` against Zenny's real `mode.json` before cutting
  over (correct mode read back, correct per-mode context string produced,
  file left byte-identical). Pre-created the plugin's one-time
  `.claude/hooks/state/.claude-md-seeded` sentinel *before* first run so the
  plugin's generic CLAUDE.md starter-block seed is skipped here — Zenny's
  own v3.1 CLAUDE.md already documents the mode system in full, no
  duplicate block wanted. Zenny's local `.claude/commands/
  {advisor,commander,execute}.md` and `.claude/hooks/session-start.ps1` are
  archived (not deleted) at `00_Project_Control/Completed_Task_Archive/
  role-modes-plugin-migration/`, and the now-redundant `SessionStart` hook
  entry (pointing at the archived `.ps1`) was removed from
  `.claude/settings.json`. Every other Zenny-specific hook actually wired in
  `.claude/settings.json` (pip-guard, permission-fallback, post-edit,
  prompt-routing, session-end) is untouched — none of it is part of the
  plugin. (`enforce-venv.ps1` also exists in `.claude/hooks/` but, checked
  while making this edit, isn't referenced by any hook entry in either
  settings file — a pre-existing gap unrelated to this migration, not
  something this card disturbed or fixed.)
- **What moved:** the three commands (`advisor`/`commander`/`execute`), the
  `mode.json` state mechanism, the SessionStart mode-injection hook, and the
  bounded-handoff rules (Commander↔Execute self-invocation, Advisor as a
  leaf state).
- **What stayed Zenny-only, on purpose:** `pip-guard.ps1`, `enforce-venv.ps1`,
  `permission-fallback.ps1`, `post-edit.ps1` — project-specific tooling, not
  part of "the mode system."
- **Genericization:** the three Zenny hardcodes (`Claude_Build_Command_Protocol_v2.md`
  by name, `PROJECT_STATE.md`/Wiki by name, the n8n/Supabase/VPS/DNS infra
  list) were replaced with fallback language — "follow this project's own
  protocol/state-doc/infra-list if its CLAUDE.md names one, else use generic
  defaults." Zenny's own copies of these files are **left untouched** —
  Zenny keeps using its own local `.claude/commands/*.md` +
  `.claude/hooks/session-start.ps1` for now. Migrating Zenny itself onto the
  plugin (vs. keeping both) is a separate, not-yet-made decision.
- **Cross-platform:** the plugin's hook runs as plain Node.js
  (`hooks/session-start.js`), not PowerShell — works identically on
  Windows/macOS/Linux, unlike Zenny's own current `.ps1` hooks.
- **Smart-seeding mechanism:** on first SessionStart in any project that
  installs the plugin, it idempotently (marker-guarded, sentinel-gated —
  verified non-duplicating on repeat runs) appends a starter block to that
  project's own `CLAUDE.md`, explaining the three modes and prompting the
  human to fill in project-specific detail (state-doc name, infra list,
  Build Card format). It also explicitly recommends pairing this with a
  Wiki-style durable-memory plugin — deferred as a separate follow-up, not
  built yet.
- **Review pass:** built via BC-TOOL-001 (Commander→Execute, 2026-08-26),
  then run through `/simplify` (4 parallel angle reviews — reuse,
  simplification, efficiency, altitude) before commit. Fixed: two
  write-only/never-read state fields (`effort`, `permission_mode`) dropped
  from the schema; a check-then-act filesystem race collapsed into
  try/catch; CLAUDE.md seeding changed from a full-file read every session
  to a cheap sentinel-file stat; README's "bounded auto-handoff" claim
  corrected to state plainly that only the four hard-stop conditions are
  built into the generic core — a numeric handoff cap is opt-in via a
  consuming project's own CLAUDE.md, same as Zenny's own CLAUDE.md defines
  one on top of this pattern.
- **Explicitly out of scope for v1.0.0:** a machine-parsed project-config
  file (to replace the repeated "if this project defines X, else default to
  Y" fallback prose across command files) and a shared `set-mode.js` writer
  script — both legitimate ideas surfaced during review, deferred rather
  than built, per "neither mode over-engineers."

- **BC-TOOL-005 update (2026-08-26), per human's 13-point feedback pass:**
  the CLAUDE.md seed target moved from a project's root `CLAUDE.md` to
  `.claude/CLAUDE.md` (tool/plugin instructions stay out of the doc a human
  actually maintains; Claude Code loads both the same way). Zenny itself is
  unaffected — it pre-created its own `.claude-md-seeded` sentinel during
  BC-TOOL-002 specifically to skip this seed entirely, and that sentinel
  still blocks it regardless of which path the code now targets. Also
  added this session: a generic `build-cards` skill (fallback Build Card
  format for projects without their own); a memory-system decision gap
  closed (Commander recommends `project-memory` if installed, else asks
  once and records the answer); an explicit live-infra handoff safe-gate
  (default 5 consecutive Build Cards, configurable via `.claude/CLAUDE.md`)
  — codifying what was previously only Zenny's own CLAUDE.md convention
  (3 cards) as a portable, project-overridable default in the plugin
  itself; and a correction to the README's "kept bare" claim about slash
  commands — Claude Code namespaces every plugin command, so `/commander`
  never actually worked, only `/role-modes:commander` does, and the docs
  were wrong to imply otherwise. Live-verified fresh + idempotent +
  alongside `project-memory` in one scratch project (both `.claude/
  CLAUDE.md` blocks present, no sentinel collision). Pushed `d0a1365`. See
  [[reference/project-memory-plugin]] for the sibling plugin's matching
  update.

- **BC-TOOL-008 update (2026-08-26), same root-cause fix as the sibling
  `project-memory` plugin:** live testing of a fresh project-scope install
  showed nothing activated after `/plugin install role-modes@role-modes`.
  Confirmed against Claude Code's docs: no `PluginInstalled`/
  `PluginEnabled` hook exists, `SessionStart` at the next real session
  boundary is the only mechanism, and installing mid-session never fires
  one - not a plugin bug. Fixed the `SessionStart` matcher from
  `startup|resume|compact` to add `clear|fork`, and added an explicit
  README caveat instead of implying instant activation. Trivial diff (one
  config string, one README paragraph) - self-assessed and the `/simplify`
  4-agent dispatch was skipped, per this project's established
  pure-diff-skip pattern. Live-verified alongside `project-memory` in one
  scratch project. Pushed `7dee8ec`. See
  [[reference/project-memory-plugin]] for the sibling plugin's matching
  update (which also moved its scaffold files to `.project-memory/`).

- **BC-TOOL-009 update (2026-08-27), manual setup + README overhaul:** even
  with BC-TOOL-008's `clear|fork` matcher fix, `/plugin install` mid-session
  still can't fire any hook (confirmed, not new) - so the `.claude/CLAUDE.md`
  starter-block seed still waits for a real session boundary. `mode.json`
  itself was already fine: any `/role-modes:*` command writes it the moment
  it's invoked, restart or not. Added `/role-modes:init` (`commands/init.md`)
  to seed the CLAUDE.md block on demand. Its content is a literal copy of
  `hooks/session-start.js`'s `seedClaudeMd()` output, since a slash-command
  can't `require()` a hook file (confirmed via `claude-code-guide`:
  `${CLAUDE_PLUGIN_ROOT}` is hooks/MCP/LSP/monitor-only, not readable from a
  command's execution context) - verified byte-identical against the real
  hook's output in a scratch project before committing. `/simplify`'s
  altitude-review agent flagged that a maintenance comment alone doesn't
  *enforce* the two copies staying in sync - added `scripts/check-init-sync.js`,
  which actually runs the hook against a scratch project and byte-diffs its
  output against the command file, so future drift is a failing check, not a
  hoped-for human memory. Also overhauled the README: an Install-time
  pointer to `/role-modes:init`, a Setup section, and a worked Usage example
  transcript (previously text-only description, no worked walkthrough).
  **Process note:** hit the `simplify-guard` PreToolUse hook resolving the
  wrong repo's git-dir when the commit was issued as `cd <path> && git
  commit` - the hook reads the Bash tool's registered `cwd`, which a `cd`
  inside the command string doesn't change, so it checked Zenny's own
  marker instead of the plugin repo's. Fixed by using `git -C <path> commit`
  instead, which the hook's `-C`-aware git-dir resolution handles correctly.
  Pushed `aa14e86`. See [[reference/project-memory-plugin]] for the sibling
  plugin's matching BC-TOOL-010 update.

See [[platform-quirks/mode-self-invocation-limits]] for the underlying
mode-invocation mechanics this plugin also encodes.
