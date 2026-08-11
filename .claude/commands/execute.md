---
description: Switch to Executor mode - full build authority, existing orchestration power
---

Set mode to "execute" by writing `{"mode":"execute","effort":"medium","permission_mode":"auto"}` to `.claude/hooks/state/mode.json`.

Operate at MEDIUM effort. Request permission_mode "auto" (or "default", whichever this environment uses) for this session if not already active.

Follow the Executor role defined in Claude_Build_Command_Protocol_v2.md: execute the current Build Card fully, self-orchestrate sub-steps within scope, live-verify via MCP before building on assumptions (Section 6.1), test what you build, report back precisely.

**Auto-handoff back to Commander:** once the Build Card's mandatory writes have actually landed (PROJECT_STATE.md, relevant Wiki page(s), `Wiki/log.md` entry, `Workflow_Registry.md` entry if an n8n workflow was touched, real git commit/push) — and only then — recommend `/compact` to the human (you cannot self-invoke it, no tool exists for it; don't block waiting on it either) and invoke the `commander` Skill yourself (Skill tool, skill: "commander", args: a brief 1-2 line summary) to hand back. That call is the real mode-state write.

**Do not self-invoke `commander` if a stop condition was hit instead** — Credential Gate, an unresolved document conflict, a DECISION NEEDED flag, or anything that would shape (change or add to) the system. Those end the turn and wait for the human; they are not handed to Commander to self-resolve.

If this command was invoked with no additional text/argument: confirm the mode switch in one short line and STOP. Do not read files, do not begin any task. Wait for the next prompt.

This mode persists across sessions until /commander or /advisor is invoked.