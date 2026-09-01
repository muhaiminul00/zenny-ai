## Memory System

Zenny's own raw three-layer Wiki system (PROJECT_STATE.md + `Wiki/*/*.md`
+ `Wiki/log.md`, per root `CLAUDE.md`'s "The Wiki" standing rule) —
**not** the portable `project-memory` plugin. Recorded 2026-08-29 per
explicit human correction (role-mode-gstack planning session): a prior
Wiki page loosely implied migration to the portable plugin was pending;
it is not — raw stays authoritative for Zenny unless/until this line is
changed.

<!-- gstack-pilot-plugin:v1 -->
## Role Modes + gstack Bridge (gstack-pilot plugin)

This project has the `gstack-pilot` plugin installed - the `role-modes`
three-mode system, natively chained into the gstack skill suite. Modes persist
across sessions in `.claude/hooks/state/mode.json`. Invoke them as
`/gstack-pilot:advisor`, `/gstack-pilot:commander`,
`/gstack-pilot:execute` - Claude Code namespaces every plugin slash command
with the plugin name, so a bare `/commander` will not resolve to this command.

- `/gstack-pilot:advisor` - default. Low-effort Q&A only, no build actions,
  no gstack chaining.
- `/gstack-pilot:commander` - plans work, chains into gstack's office-hours /
  plan-eng-review / autoplan for the plan's substance, may execute only trivial/
  safe/read-only single-file actions directly, hands off anything else to
  `/gstack-pilot:execute`.
- `/gstack-pilot:execute` - full build authority within an approved scope of
  work; wraps up PR-first (no trivial-housekeeping exemption) through gstack's
  review -> qa -> ship chain before merging.

**Mode-gstack Bridge - this section only, not a routing table:** the two bullets
above are the actual mode->skill chain this plugin fires automatically. If this
project also has gstack's own onboarding-injected flat trigger->skill routing
table elsewhere in this file (a separate "## Skill routing" style section,
gstack's own `preamble-routing-injection` output) - that section is
complementary, not duplicative: it covers ad-hoc "which skill handles this
request" dispatch, this section covers the ordered mode-chain sequence. Do not
merge or re-derive one from the other.

Memory system: Commander checks once, on its first run in this project, whether
a memory system is already recorded below. If none is, it recommends the
`project-memory` plugin (https://github.com/muhaiminul00/project-memory) if
installed, or asks which memory system to use otherwise, then records the answer
here so it is never re-asked.

Live-infra handoff safe-gate: Commander/Execute stop for a human pulse-check
after 5 consecutive Build Cards completed unattended, or any single card that
writes to live infra - whichever comes first. Change the 5 by telling Claude a
new number in Commander mode; it updates this line.

Fill in the specifics that make this useful for THIS project:
- State Doc: (name this project's state-tracking doc / decision log, if any -
  Commander's pre-session briefing hook reads this path automatically once set).
- List what counts as "live infra" here (databases, deploy targets, paid
  services) so Commander knows what to hand off instead of touching directly.
- Name this project's own Build Card / task-spec format, if any (the
  `build-cards` skill this plugin ships is used as a generic fallback
  when none is named).
- Env/tooling convention (if any) - e.g. venv-only installs + a tracked
  requirements file so teammates share a synced environment via GitHub, or none.
<!-- gstack-pilot-plugin:v1 -->
