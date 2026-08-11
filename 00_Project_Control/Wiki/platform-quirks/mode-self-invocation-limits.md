# Mode self-invocation: what's actually possible

## `/commander`, `/execute`, `/advisor` can be self-invoked — for real

These are project-defined Skills (`.claude/commands/commander.md`,
`execute.md`, `advisor.md`), each of which writes
`.claude/hooks/state/mode.json` when run. Because they're Skills, they
can be invoked programmatically via the Skill tool — Commander calling
`Skill(skill: "execute", args: "...")` mid-turn produces the exact same
real `mode.json` write a human typing `/execute` would. This is what
CLAUDE.md's "Commander → Execute auto-handoff" section relies on.

## `/clear` and `/compact` cannot be — no tool exists for either

These are core CLI session-management commands, not project Skills —
`.claude/commands/` has no entry for them, and no tool in this
environment's surface triggers either one. There is currently no way
for Commander or Execute to self-invoke a context clear or a compact,
no matter how the protocol is worded around them.

**Current workaround:** the mode that would want one (Commander for
`/clear` on a long session, Execute for `/compact` at the end of a
finished Build Card) states the recommendation plainly to the human and
proceeds — it does not block waiting for either action, since neither
party can force it. If a future tool or hook closes this gap, update
this page and CLAUDE.md's auto-handoff section together.

## Why this page exists

2026-08-12: Commander ran two live read-only Supabase queries
(`execute_sql`, `list_tables`) while `.claude/hooks/state/mode.json`
still read `"commander"` — reasoning from the *intent* of the
auto-handoff rule ("proceeds directly into Execute") rather than its
literal mechanism (self-invoking the `execute` Skill, which is the
actual state change). No live write occurred and nothing needed
rolling back, but it was a real violation of Commander's own stated
boundary, caught by the human, not by design. Corrected same session —
[[BC-040]] auto-handoff wording tightened in CLAUDE.md and all three
`.claude/commands/*.md` files to make the mechanism explicit: the mode
Skill call itself *is* the checkpoint, not a formality after the fact.
