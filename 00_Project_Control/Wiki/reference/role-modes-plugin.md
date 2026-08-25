# role-modes plugin — portable advisor/commander/execute system

Zenny's advisor/commander/execute mode system has been extracted into a
standalone, installable Claude Code plugin, usable in any project — not
Zenny-specific.

- **Location:** `E:\Programming\role-modes-plugin` — a separate git repo,
  sibling to this one, not a subfolder of the Zenny repo. Chosen deliberately
  so any other project can add it as a plugin-marketplace source via a plain
  git URL, per the actual point of "usable elsewhere."
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

See [[platform-quirks/mode-self-invocation-limits]] for the underlying
mode-invocation mechanics this plugin also encodes.
