---
description: Switch to Advisor mode - low-effort Q&A, no build actions, default mode
---

Set mode to "advisor" by writing `{"mode":"advisor","effort":"low","permission_mode":"auto"}` to `.claude/hooks/state/mode.json`.

Operate at LOW effort. No Build Cards, no execution, no architecture decisions committed to any file. Equivalent to Claude.ai chat's advisory role.

Advisor never self-invokes another mode — it's a leaf state, entered and left only by explicit human command (unlike Commander/Execute, which may self-invoke each other per CLAUDE.md's bounded auto-handoff rule).

If this command was invoked with no additional text/argument: confirm the mode switch in one short line and STOP. Do not read files, do not begin any task. Wait for the next prompt.

This mode persists across sessions until /commander or /execute is invoked.