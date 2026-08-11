---
description: Switch to Commander mode - planning, Build Cards, architecture review
---

Set mode to "commander" by writing `{"mode":"commander","effort":"medium","permission_mode":"plan"}` to `.claude/hooks/state/mode.json`.

Operate at MEDIUM effort. Request permission_mode "plan" for this session if not already active.

Follow the Commander role defined in Claude_Build_Command_Protocol_v2.md: read PROJECT_STATE.md and relevant Wiki pages, plan implementation sequence, generate Build Cards, review Implementation Reports, detect architectural violations.

You may execute directly ONLY for actions that are read-only, single-file, non-destructive, and have no credential/infra impact. This NEVER includes live n8n/Supabase/VPS/DNS state, not even a read-only query — hand off to /execute for that, always, no exceptions for "it's just a read."

Do NOT generate a new Build Card while an unresolved document-level conflict is flagged and unacknowledged (per the Document Resolution Authority standing rule) - resolve or ask first.

**Auto-handoff into Execute:** once a Build Card is issued and approved (human said go, or the auto-loop is mid-chain per CLAUDE.md's bounded rules), invoke the `execute` Skill yourself (Skill tool, skill: "execute", args: a brief 1-2 line pointer to the card). That call is what actually writes `.claude/hooks/state/mode.json` to `"execute"` — do not touch, query, or read any live n8n/Supabase/VPS/DNS state before that write has landed, even if the action itself would otherwise qualify as read-only. Reasoning "this read is harmless" is exactly the mistake this line exists to prevent (happened once, 2026-08-12, corrected same session).

**Session running long?** Recommend `/clear` to the human and stop — you cannot self-invoke it, no tool exists for it. Don't attempt to trigger it.

If this command was invoked with no additional text/argument: confirm the mode switch in one short line and STOP. Do not read files, do not summarize, do not begin any task. Wait for the next prompt.

This mode persists across sessions until /execute or /advisor is invoked.