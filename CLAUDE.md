# Zenny AI Workforce — Claude Code Instructions


Project:   Zenny (by ZeroManual)
Document:  CLAUDE.md v3.1 — single-tool, three-mode operating model


---

## Project Summary

Zenny is a multi-tenant AI customer-agent platform built by ZeroManual.
Businesses (clients) each get an AI agent that talks to their customers
across chat/voice/email — handling bookings, orders, support, and lead
capture — tailored to one of 6 business archetypes (emergency, commerce
ecom, commerce restaurant, appointment, consultation, engagement).

Real stack:
- **Convocore** — conversation layer (chat/voice agent, Canvas-built, per-client)
- **n8n** — execution layer (workflows that do the actual work)
- **Supabase** ("zenny-vault" project) — database: `control` schema
  (cross-client) + one schema per client, cloned from an archetype
  `tpl_*` template
- **Dashboard** — React/Vite/TS, deployed at dashboard.zeromanuals.com

---

## Session Start — read in this exact order, nothing else by default

1. **PROJECT_STATE.md** — current phase, module status, active blockers.
   Read in full every session. Kept under ~150 lines on purpose.
2. **Wiki/index.md** — catalog of durable facts/decisions. Read the
   index only; drill into a specific `Wiki/*/*.md` page only when the
   current task actually touches that topic.
3. **This file (CLAUDE.md)** — you're reading it now.
4. The specific frozen architecture document a Build Card names, if any
   — not the full document set by default.

**Never read by default, ever** — only on an explicit historical/audit
request ("when did we decide X"):
- `Wiki/log.md`
- `00_Project_Control/Session_Log_Archive.md`
- `_archive_planning_phase/`, `Completed_Task_Archive/`

---

## Modes — /commander, /execute, /advisor

This project runs on ONE tool (Claude Code) in three modes, switched via
slash-command. Mode persists across sessions via
`.claude/hooks/state/mode.json` until explicitly changed. A fresh
session with no prior state defaults to `/advisor`.

Full role definitions live in `Claude_Build_Command_Protocol_v2.md`
(v2.4) — this section is the short version:

- **`/commander`** — plan, generate Build Cards, review Implementation
  Reports. May execute directly ONLY if the action is read-only,
  single-file, non-destructive, and has no credential/infra impact.
  Anything touching live n8n/Supabase/VPS/DNS/git-write hands off to
  `/execute`. Will NOT generate a new Build Card while an unresolved,
  unacknowledged document-level conflict is flagged.
- **`/execute`** — full build authority, self-orchestrates within a
  Build Card's scope, live-verifies via MCP before assuming anything
  (see Mandatory MCP Verification below).
- **`/advisor`** — default mode. Low-effort Q&A only. Never generates a
  Build Card, never executes, never commits a decision to any file.

Invoking a mode with no other text: confirm the switch in one line and
stop. Do not read files or start a task.

**Known limitation, stated plainly:** the mode-state file controls which
role/instructions you follow and persists that choice across sessions.
It does NOT and cannot force real effort-level or permission-mode
settings — those require the actual CLI mechanism (`/model`, or this
environment's real permission-mode command) if you want them set for
real, not just described in context.

### Commander → Execute auto-handoff

Once a Build Card is issued and approved, Commander proceeds directly
into Execute — no human has to type `/execute` as ceremony. Concretely,
this means Commander invokes the `execute` Skill itself (with a brief
1-2 line pointer to what to build), which is what actually writes
`.claude/hooks/state/mode.json` to `"execute"` — the same real state
change a human-typed `/execute` produces. **No infra-touching or live
n8n/Supabase/VPS/DNS action — not even a read — happens until that
mode-state write has actually landed.** Commander's own "read-only,
single-file, non-destructive, no credential/infra impact" direct-execute
allowance never extends to live n8n/Supabase/VPS/DNS state, reads
included; the moment a Build Card needs to touch any of that, the next
action is invoking the `execute` Skill, not the touch itself. (This
line exists because that exact mistake happened once, 2026-08-12 —
Commander ran live read-only Supabase queries while `mode.json` still
read `"commander"`, reasoning from this section's *intent* instead of
its literal mechanism. Corrected same session — see `Wiki/log.md`.)

Execute, once its Build Card is genuinely complete (mandatory writes
landed — see below), invokes the `commander` Skill itself the same
way, with a brief 1-2 line summary, to hand back — again a real
mode-state write, not just a description of intent to hand back.

This self-chaining is bounded, not indefinite. It stops for a human
pulse-check (one line: "N cards done, all verified, continue?" — not a
full review) after either:
- 3 consecutive Build Cards completed unattended, or
- any single card that wrote to live n8n/Supabase/DNS/VPS state.

This sits on top of, and never replaces, the existing stop conditions:
Credential Gate, an unresolved document-level conflict, an explicit
"DECISION NEEDED" flag, or anything that would shape (change or add to)
the system. Those always stop the loop outright, unbounded-card-count
or not — "stop" means end the turn and wait for the human, never
self-invoke the next mode instead.

**`/clear` and `/compact` cannot be self-invoked — no tool exists for
either, unlike `/commander`/`/execute`/`/advisor`, which are real
project Skills.** Until a real mechanism exists: at the point this
section previously said "any `/compact` at the end of an Execute pass
may only run after mandatory writes are confirmed on disk," read that
as Execute *telling the human* `/compact` is recommended now (session
mandatory writes are done — PROJECT_STATE.md, relevant Wiki page(s),
`Wiki/log.md` entry, `Workflow_Registry.md` entry if an n8n workflow
was touched, real git commit/push) and then proceeding to hand back to
Commander regardless — never blocking the loop on an action neither
mode can actually trigger. Same for Commander noticing a session
running long: flag it and recommend `/clear`, don't attempt to invoke
it. Full detail: `Wiki/platform-quirks/mode-self-invocation-limits.md`.

**Verification is not optional inside the loop.** No Build Card is
marked done on the strength of `validate_workflow` or similar checks
alone — live verification via MCP (Mandatory MCP Verification below) is
required before Definition of Done is claimed, every time, auto-loop or
not.

**Neither mode over-engineers.** Both modes build the smallest correct
thing that satisfies the Build Card's Acceptance Criteria — no
speculative abstraction, no extra config surface, no "while I'm in here"
scope creep. If Execute hits a genuine blocker (missing capability,
ambiguous field, tool gap), it looks for the smallest correct
alternative already available (existing RPC, existing node type,
existing Wiki precedent) before stopping — the same "search broadly
first" discipline the Document Resolution Authority already applies to
doc conflicts, applied here to build blockers.

---
## Build Card System
**Every Build Card Contains:**

- Build Card ID
- Target (workflow name / migration / dashboard piece / Edge Function)
- Runtime Module or system area --> Architectural constraints
- Objective -->
--  Purpose 
--  Inputs
--  Outputs
- Dependencies / Required utilities
- Shared Utilities involved / Folder/location placement
- Acceptance Criteria
- Test Cases / Testing instructions
- Definition of Done / Expected outputs
- Open Verification Items resolved by this card, if any.

**Commander's scoping responsibility:** a Build Card's scope must trace
to the system's actual working method and stated goal (Project
Summary), not just be technically achievable. Before issuing a card,
Commander checks it against PROJECT_STATE.md and the relevant Wiki
page — a card that's correct in isolation but drifts from what the
platform is actually for gets rejected before it's issued, not caught
after Execute builds it.

---

## gstack

`garrytan/gstack` (55 skills) is installed globally (`~/.claude/skills/
gstack`, non-team — not project-scoped, human declined `--team` for
now). **For all web browsing, use gstack's `/browse` skill — never the
`mcp__claude-in-chrome__*` tools.**

**Dispatch is a real skill, not this section**: `.claude/skills/
using-gstack/SKILL.md` is the authoritative router — which gstack skill
wins vs. Zenny's own for every task category, the memory-system
instruction (Wiki only, never GBrain), and the two enforcement seams
(stop-conditions, standing-rule application on gstack's output). It
auto-surfaces in the skill listing the same way this section used to be
manually checked. Full rationale/decision history: `Wiki/reference/
gstack-skill-playbook.md`.

---

## Tool Routing Table

Check this before manual grep/bash/ad-hoc search. Route to the bundle;
let Claude pick the right skill within a single-domain bundle.

| Task category | Tool |
|---|---|
| Find code/call chains in Dashboard | codebase-memory-mcp MCP (search_graph, trace_path, get_architecture) |
| Convert a large, stable reference doc into a loadable structure | book-to-skill (CLI, via `.zenny-py-venv`) — one-time, not for fast-changing files |
| Anything n8n | n8n-skills bundle + n8n MCP |
| Anything Hostinger (VPS/DNS/domains/hosting/billing) | hostinger-agent-skills bundle + Hostinger MCP |
| Anything Supabase (schema/RLS/queries/migrations) | supabase + postgres-best-practices bundles + Supabase MCP |
| Live browser verification, QA, screenshots | gstack `/browse`/`/qa`/`/qa-only` — see `.claude/skills/using-gstack/SKILL.md`. Playwright MCP retired from the default path (still installed, ad hoc only). |
| Frontend/component structure | frontend-design |
| Debugging with unclear root cause | gstack `/investigate` — see `using-gstack`. `superpowers:systematic-debugging`/`mattpocock-skills:diagnosing-bugs` retired from the default path, still usable by name. |
| Before claiming a fix is done/verified | superpowers:verification-before-completion — mandatory gate, always (no gstack equivalent) |
| Isolated risky change | superpowers:using-git-worktrees |
| Writing a plan, then executing | superpowers:writing-plans → superpowers:executing-plans (feature-planning substance goes through gstack first — see `using-gstack`) |
| Code/diff review pass, default pre-ship | gstack `/review` — now the real default, per the branch/PR workflow adopted 2026-08-29 (Standing Rule — Branch/PR Workflow above). `mattpocock-skills:code-review`/`superpowers:requesting-code-review`/`simplify` stay available for ad-hoc use outside a PR. See `using-gstack`, `Wiki/reference/gstack-skill-playbook.md`. |
| TDD | mattpocock-skills:tdd |
| Architecture/codebase design review | mattpocock-skills:codebase-design |
| Merge conflicts | mattpocock-skills:resolving-merge-conflicts |
| New feature, unclear scope [user-only, invoke by name] | mattpocock-skills:grill-with-docs |
| End of session [user-only] | mattpocock-skills:handoff |
| Deep architecture improvement pass [user-only] | mattpocock-skills:improve-codebase-architecture |
| Discussion → spec/tickets [user-only] | mattpocock-skills:to-spec / to-tickets |
| Dashboard aesthetic judgment | taste-skill:taste-skill |
| Dashboard brand consistency | taste-skill:brandkit |
| Dashboard minimal-direction check | taste-skill:minimalist-skill |
| General dashboard polish | impeccable |

---

## Standing Rule — Python Installs

All Python packages install into the project venv (`.zenny-py-venv`)
only. Never global/system Python. **Applied as a standing instruction,
not a hook** (`pip-guard.ps1` retired 2026-08-29, gstack-integration
Phase 3 — no reliable equivalent tool-gate existed on gstack's side
either, so this became prose enforcement like everything else in this
section) — if you determine a package genuinely cannot work in the
local venv, or forcing it there would cost more tokens than it's worth,
you may proceed with a global install, but you MUST log a 1-2 line
reason both in your response summary and as a new entry in
`Wiki/log.md` (`## [date] pip-global | package | reason`).

---

## Standing Rule — Mandatory MCP Verification

Before executing any Build Card, verify the specific node, capability,
or field it depends on directly against the live n8n MCP / Supabase MCP
connection — not recited from a frozen architecture document. Scoped to
the one capability the current Build Card needs, not a full platform
audit every session. Full detail: `Claude_Build_Command_Protocol_v2.md`
Section 6.1.

---

## Standing Rule — Credential Testing Approach

When a workflow needs a real third-party credential and full production
Vault-based storage isn't ready: use n8n's HTTP Request node with a
Generic Header Auth credential holding a real test-account token. Never
n8n's native OAuth-specific nodes for this. Applies to every provider
integration.

---

## Standing Rule — Credential Gate

Never create or invent a credential. If a Build Card needs one: build
every non-secret field, leave the credential empty or use the agreed
placeholder pattern, stop and report exactly what's required. Human
adds it, you resume. Full detail: Protocol v2 Section 8.

---

## Standing Rule — Document Resolution Authority

When you hit a conflict, gap, or apparent error in a system document
mid-session, you may resolve it yourself and keep working — conditional
on the discipline below, every time:

1. Search the relevant system documents first, broadly — the answer is
   often in a different document than the one that raised the question.
2. If a document has the answer, that answer wins, even over an older
   or narrower document. Cite which document resolved it and why.
3. If a real search finds no answer: resolve it yourself only if it's a
   verification-level fact or a mechanical/structural decision with one
   obviously correct answer given everything already established.
   Otherwise — stop and ask.
4. A document explicitly flagged "DECISION NEEDED" stays open unless a
   *different* document actually resolves it. Your own reasoning never
   overrides an explicit open-decision flag alone.
5. Never invent a plausible-sounding answer to fill a gap.

**Logging, never skipped:** log any self-resolved document-level item as
a new/updated page in the relevant `Wiki/*/` folder (not PROJECT_STATE.md
— that's a pure dashboard now) AND as an entry in `Wiki/log.md`. State
the conflict/gap, documents checked, what it resolved to, and why.

**After logging, stop.** Do not begin the next Build Card's work — even
if already issued — until the human has explicitly acknowledged that
specific resolution in a follow-up message. A session with zero
self-resolved document-level items is not subject to this gate.

---

## Standing Rule — Per-Workflow Documentation

Any session that creates or meaningfully modifies an n8n workflow must
add/update that workflow's entry in
`06_Infrastructure/n8n/Workflow_Registry.md` before that session's
Definition of Done is considered met — written from a live
`get_workflow_details` read, never reconstructed from memory or from
PROJECT_STATE.md prose.

---

## Standing Rule — Permission Denials (n8n / Supabase / git)

**Applied as a standing instruction, not a hook** (`permission-
fallback.ps1` retired 2026-08-29, gstack-integration Phase 3). When a
permission is denied:

1. Check for an easy, equivalent alternative. If one works, use it —
   then note the substitution in the relevant Wiki page AND `Wiki/log.md`
   ("use X, not Y, going forward") so future sessions don't hit the
   same wall.
2. If no alternative exists, judge whether the denied action is
   ESSENTIAL to completing the current task:
   - Essential → stop, explain what's blocked and why, ask the human to
     grant/allowlist it.
   - Not essential (e.g. a routine git commit that doesn't block the
     actual task) → do NOT stop. Continue the task, flag the pending
     action at the END of your response summary instead.

---

## Standing Rule — The Wiki (`00_Project_Control/Wiki/`)

Three-layer memory model, replacing the old single-file Session Log:

- **PROJECT_STATE.md** — current truth only, overwritten each session.
  If a line describes something that *happened* rather than something
  that *is currently true*, it does not belong here.
- **`Wiki/*/*.md`** — durable facts and decisions, organized by topic
  (`credentials/`, `infra/`, `platform-quirks/`, `decisions/`), edited
  in place as understanding changes, never just appended to. `Wiki/
  index.md` is the catalog — read it, then drill into specific pages.
- **`Wiki/log.md`** — append-only chronological record. Cold storage,
  read only for historical/audit purposes.

**Promotion rule**, applied at the end of every session:
- Learned a durable fact or made a decision? → Wiki page (create or
  edit in place), cross-referenced in `index.md`.
- Just completed a task with no new durable fact? → one-line
  PROJECT_STATE.md status update.
- Full narrative of *how* something happened (exact commands, exact
  errors)? → `Wiki/log.md`. Never in PROJECT_STATE.md.

**Confidence rule:** if the Wiki has no page or only weak/tangential
matches for a query, say so explicitly. Never synthesize an answer from
unrelated pages, and never file a low-confidence synthesis back into the
Wiki as if it were established fact.

**Lint operation:** roughly every 5 sessions, in `/commander` mode,
run a Wiki health-check — contradictions, orphan pages, stale claims,
missing cross-references. Fix what you find, log the correction in
`Wiki/log.md` the same as any other resolution.

---

## PROJECT_STATE.md — Mandatory Session Protocol

At the START of every session: read PROJECT_STATE.md in full before
touching any code — see Session Start order above.

At the END of every session, before ending:
1. Apply the promotion rule above — update PROJECT_STATE.md's status
   sections (overwrite, don't append) and/or the relevant Wiki page(s).
2. Commit the full repo via real git commands (not any MCP git tool),
   add/commit/push to `origin` (renamed from `zenny-sync` 2026-08-29 —
   see Standing Rule — Branch/PR Workflow below for why). Trivial
   Wiki/log/PROJECT_STATE-only wrap-up commits go direct-to-`main`, same
   as always; substantive work follows the branch/PR flow instead.
3. Confirm in your final output that PROJECT_STATE.md/Wiki were updated
   and pushed — part of Definition of Done, not optional cleanup.

---

## Standing Rule — Branch/PR Workflow

Adopted 2026-08-29 so gstack's `/review`/`/ship` pipeline is actually
usable, not just documented — both hard-require a remote literally
named `origin` and a real branch-vs-base-branch diff. The remote
(`github.com/zeromanualai/zenny-producition-sync`) was renamed
`zenny-sync` → `origin` for this; nothing else about the remote changed.

**Substantive work** (a Build Card's implementation, code/workflow
changes, anything Execute builds against an approved scope): feature
branch → push → `gh pr create` → gstack `/review` → fix findings →
`/ship` (mandatorily runs `/document-release` first) → merge → delete
branch. This is the default path now, not an alternative to direct-to-
`main` commits.

**Trivial session housekeeping** (a Wiki page edit, a `Wiki/log.md`
entry, a `PROJECT_STATE.md` status update, with no code/workflow
change riding along) stays direct-to-`main`, same as before adopting
this — routing pure bookkeeping through a PR would be exactly the
over-engineering this document already tells both modes to avoid.

Full narrative and the live end-to-end proof this actually works:
`Wiki/log.md` session-gstack-branch-pr-workflow,
`Wiki/reference/gstack-skill-playbook.md`.

## Repo Notes

- `_archive_planning_phase/`, `Completed_Task_Archive/` — reference
  only, never part of the active read set, never scanned by default.
- `.mcp.json` holds a live Convocore `WORKSPACE_SECRET` in plaintext —
  never commit real secrets in `.mcp.json`/backups/any credential
  `.txt` file at root; `.gitignore` excludes these — check before every
  commit that nothing secret is staged.
- Full governance model (Build Cards, Compliance Checklist, Change
  Requests, Definition of Done): `Claude_Build_Command_Protocol_v2.md`.
---
#### ZeroManual · Zenny AI Workforce · CLAUDE.md v3.1 · BUILD PHASE

