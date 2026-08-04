# PROJECT_STATE.md — Live Build State

```
Purpose:   Real, current ground truth of what's actually built, tested,
           and blocked — updated by Claude Code at the end of every
           session. This is NOT a plan (that's Planning_to_Build_
           Transition_v1.md) — it's a status snapshot. The Commander
           reads this before issuing every new Build Card.
Rule:      Overwrite the status sections below each session. NEVER
           delete the Session Log — it's append-only, oldest at bottom.
Location:  Project root. Committed to git (zenny-sync) after every
           Claude Code session, alongside whatever code/schema changed.
```

---

## Last Updated
2026-08-05 — by Claude Code, Session 1

## Current Phase
Phase 0 — Environment Setup — IN PROGRESS (blocked, see Blockers below)

---

## Phase Checklist (mirrors Planning_to_Build_Transition_v1.md Part 4)

```
Phase 0  — Environment Setup .................... IN PROGRESS
Phase 1  — Close Credential Platform Gaps ........ NOT STARTED
Phase 2  — Convocore Database Changes ............ NOT STARTED
Phase 3  — Remaining Shared Utilities ............ NOT STARTED
Phase 4  — Convocore Adapter (ADP-002) ........... NOT STARTED
Phase 5  — 4 New Dashboard Systems (Directus) .... NOT STARTED
Phase 6  — Core Agent ............................ NOT STARTED
Phase 7  — Growth Agent .......................... NOT STARTED
Phase 8  — Conversion Engine (11 Tools) .......... NOT STARTED
Phase 9  — Recovery Engine ....................... NOT STARTED
Phase 10 — Email Manager ......................... NOT STARTED
Phase 11 — Scheduled Workflows ................... NOT STARTED
Phase 12 — Node-by-Node Outlines ................. NOT STARTED (cross-cutting)
Phase 13 — Template Dashboard .................... DEFERRED (per Part 2.6)
```

---

## Database — Real Current State

```
control.oauth_apps:              NOT YET BUILT
control.client_connections:      NOT YET BUILT
control.oauth_state:             NOT YET BUILT
control.connection_audit_log:    NOT YET BUILT
control.convocore_agent_map:     NOT YET BUILT
leads (Convocore columns):       NOT YET ADDED
escalations.escalation_team:     NOT YET ADDED
```
*(Replace with real state each session — add/remove rows as schema grows)*

## Workflows — Real Current State

```
UTIL-001 Schema Resolver:         NOT STARTED
UTIL-002 Data Validator:          NOT STARTED
UTIL-003 Error Logger:            NOT STARTED
UTIL-004 Notification Router:     NOT STARTED
UTIL-005 Stop Checker:            NOT STARTED
UTIL-006 Credential Resolver:     BUILT — tested w/ placeholder creds
SCH-006 Token Refresh Sweep:      BUILT — NOT live-tested (blocked on creds)
[... add every WF/SCH/INT/ADP as it's touched, never remove a line]
```

## Credentials — Real Current State

```
Google:     client ID + secret captured, test users added,
            verification SUBMITTED (pending)
Shopify:    client ID + secret captured
Slack:      bot token (xoxb-...) captured
Calendly:   client ID, secret, webhook signing key captured
Cal.com:    NOT STARTED — waiting on business email from human
WooCommerce: no registration needed — onboarding guide NOT written
control.oauth_apps seeded:        NO (table doesn't exist yet)
Vault storage round-trip:         WALKED THROUGH, NOT CONFIRMED
Redirect URI:                     kmhzosyljpzheqvfuyzm.supabase.co/
                                   functions/v1/oauth-callback — CONFIRMED
```

## Blockers Right Now

```
- BLOCKING: Neither Supabase MCP nor n8n MCP is configured anywhere in
  this environment. Only the Convocore MCP server is present (.mcp.json,
  npx-based). Confirmed via ToolSearch (no supabase/n8n tools exist) and
  via ~/.claude.json (no supabase/n8n server entries; this project's own
  mcpServers registry is empty). Phase 0 cannot fully close, and no
  further phase can proceed with the mandatory MCP-verification
  discipline (Protocol v2 Section 6.1), until the human provides:
    - Supabase: project ref + service_role key (or an access token) for
      the "zenny-vault" project, to configure the Supabase MCP server
    - n8n: instance URL + API key, to configure the n8n MCP server
  Claude Code cannot invent or source these credentials itself.
- control.oauth_apps table doesn't exist — blocks Vault entries from
  linking to a provider row (Phase 1 work, not blocking Phase 0 itself)
```

## Deviations From Build Card / Open Questions for Commander

```
1. No .gitignore existed at repo root — .mcp.json (plaintext
   WORKSPACE_SECRET), its docker-backup copy, and a credential .txt file
   were all unprotected from an accidental `git add .` commit. Added a
   .gitignore covering these plus common OS cruft. Flagging since this
   is a real security gap that predates this session, not something the
   Transition doc anticipated needing a fix.
2. `.claude/skills/supabase` and `.claude/skills/supabase-postgres-best-
   practices` were dangling symlinks pointing at the pre-rename project
   path (`/e/Programming/Zeny Ai - Voiceflow/...`) — the folder was
   renamed to `Zenny - breakthrough` at some point and the symlinks were
   never updated, so these skills were silently not loading. Repointed
   both symlinks to the correct current path (same target content,
   `.agents/skills/*`, untouched). Purely a path fix, no content change.
3. "Database Architecture Review & Future Runtime Roadmap v1.md" (root,
   dated 2026-07-18) was NOT archived — genuinely unsure whether its
   "Future Runtime Roadmap" content is still live or fully superseded by
   Database_Structure_v4_FINAL.md + the Convocore FINAL docs. Flagging
   per your instruction to leave-and-flag rather than guess.
4. "AI_Workforce_Implementation_Operating_Manual_v2.md" was archived
   alongside AI_Builder_Operating_Manual_v1.md even though Claude_Build_
   Command_Protocol_v2.md's Status line only names the latter as
   superseded. Its content describes the old three-party Claude Code +
   Codex model, which Protocol v2 explicitly retires ("Codex is no
   longer part of this pipeline") — judged clearly superseded by
   content, not just by an exact filename match. Flagging the reasoning
   since it wasn't a literal 1:1 per the stated rule.
5. "Zenny_production_credential(claude_code_can_use).txt" was left in
   place, untouched, not evaluated for content — file organization scope
   was documents, not credential material, and this file is exactly the
   kind of thing this session should surface rather than silently move
   or open. Now covered by .gitignore going forward regardless.
```

---

## Session Log (append-only — newest at top, never delete old entries)

### Session 1 — 2026-08-05 — Phase 0: Environment Setup
- What was done: Read all 6 required documents in full (Protocol v2,
  Transition doc, Workflow Spec, Database Structure v4 FINAL +
  current_state.sql, Client Integration & Credential Platform v1,
  External Integration Strategy v1, all 3 Convocore FINAL docs).
  Archived 5 confirmed-superseded root documents into
  `_archive_planning_phase/`. Rewrote CLAUDE.md for the build phase
  (project summary, Commander/Executor model, MCP-verification and
  credential-testing standing rules, PROJECT_STATE.md protocol block).
  Added root `.gitignore` to stop secrets from being committed. Fixed
  two dangling `.claude/skills/` symlinks left over from a project
  folder rename. Updated this file's status sections and added the
  Phase 0-13 checklist mirroring Transition doc Part 4.
- What was verified live vs. assumed: Confirmed via direct filesystem
  inspection (not assumed) that neither Supabase MCP nor n8n MCP is
  configured anywhere in this environment — searched `.mcp.json`,
  `.vscode/mcp.json`, `~/.claude.json` (global config, both its
  top-level mcpServers-style entries and this project's own per-project
  registry), and via ToolSearch for any deferred supabase/n8n tool.
  None exist; only Convocore MCP is present and working. This directly
  contradicts the session prompt's framing ("confirm Supabase MCP and
  n8n MCP access are both configured and actually working") — they are
  not configured at all, not just unconfirmed.
- What broke / changed from plan: Phase 0 cannot be marked fully
  complete — MCP setup requires credentials only the human can provide
  (see Blockers). Everything else in Phase 0's scope is done.
- Files touched: CLAUDE.md (rewritten), .gitignore (new), PROJECT_STATE.md
  (this file), .claude/skills/supabase + supabase-postgres-best-practices
  (symlinks repointed), 5 files moved into _archive_planning_phase/.

---
