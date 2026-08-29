---
name: using-gstack
description: Zenny's dispatch reference for garrytan/gstack (55 skills, installed globally). Use before choosing any skill/tool for code review, debugging, browser automation/QA, screenshots, planning a new feature or Build Card, dashboard design, security review, destructive-command safety, shipping/deploying the Dashboard repo, or documenting a change — decides gstack vs. Zenny's own skill/MCP, and applies Zenny's standing rules to gstack's output. Always-on router, same role as n8n-skills:using-n8n-skills-official and superpowers:using-superpowers for their bundles.
---

# Using gstack

gstack is machine-global (`~/.claude/skills/gstack`), not a Claude Code
plugin, not project-scoped. Its own root `SKILL.md` routes among its 55
skills; this skill sits one level above that — it decides whether a task
goes to gstack at all, or to one of Zenny's own skills/MCPs instead, and
wraps Zenny's standing rules around whatever gstack produces. Full
rationale for every row below: `Wiki/reference/gstack-skill-playbook.md`
(read it when the reasoning behind a call matters, not just the call
itself).

## Route first — highest priority, always checked before anything below

**Any live n8n/Supabase/VPS/DNS action, including a read-only one, never
goes through gstack.** Route to that platform's own MCP
(`n8n-skills`/`hostinger-agent-skills`/`supabase`+`postgres-best-practices`)
per the Mandatory MCP Verification standing rule. This overrides every
routing rule below — gstack's `/ship`→`/land-and-deploy` pipeline in
particular has no concept of live-infra state and must never be let near
it directly.

## Routing rules — task category → what wins

- **Browser automation, QA, screenshots, visual checks** → gstack
  `/browse` (never `mcp__claude-in-chrome__*` — a static Zenny/gstack
  install-time rule, also stated in root `CLAUDE.md`'s `## gstack`
  section), `/qa` (diff-aware, auto-generates regression tests),
  `/qa-only` (report without fixing), `/setup-browser-cookies`
  (authenticated testing).
- **Code review, default pre-ship pass** → gstack `/review`. Live as of
  2026-08-29: Zenny adopted a real branch/PR workflow specifically so
  this works (remote renamed `zenny-sync` → `origin` — `/review`/`/ship`
  hard-require that literal name plus a real branch-vs-base diff; see
  root `CLAUDE.md`'s Standing Rule — Branch/PR Workflow). Feature branch
  → PR → `/review` → fix → `/ship` is the default for substantive work;
  ad-hoc review outside a PR still has `mattpocock-skills:code-review`/
  `simplify` available.
- **Debugging with unclear root cause** → gstack `/investigate` (3-failed
  -attempts stop, writes the same freeze-dir state `/freeze` uses).
  Retires `superpowers:systematic-debugging` and
  `mattpocock-skills:diagnosing-bugs` from the default path — still
  usable by name if asked for.
- **Planning a new feature or a Build Card's substance** → `/office-hours`
  (idea → design doc) → `/plan-ceo-review` → `/plan-design-review`
  (dashboard/UI work only) → `/plan-eng-review`, or `/autoplan` for the
  real, automatic, unconditional chained run of all three (+
  `/plan-devex-review` if DX scope is detected). Commander still packages
  the result into a Build Card before Execute sees it — gstack's plan is
  the substance, the Build Card stays the interface to Execute.
- **Dashboard design, greenfield (new screens/systems)** → `/design-
  consultation` → `/design-shotgun` → `/design-html` generate; Zenny's
  own `taste-skill`+`brandkit`+`minimalist-skill`+`frontend-design`
  bundle is the judgment/critique gate the output must pass before a
  design pass is called done. `impeccable` keeps the post-ship live-
  polish-audit job — gstack's `/design-review` is skipped on purpose to
  avoid two full live-audit passes over the same shipped UI.
- **Security review** → gstack `/cso` (OWASP Top 10 + STRIDE) — adopted
  outright, no Zenny equivalent existed.
- **Destructive-command safety** → `/careful`/`/freeze`/`/guard`/
  `/unfreeze` — additive, no collision with anything Zenny already has.
  (Mechanically: `/guard` doesn't invoke the other two, it duplicates
  their hook registrations; `/investigate`'s auto-freeze is the same
  re-implementation pattern, not a Skill-tool call.)
- **Shipping/deploying — Dashboard repo only** → `/ship` →
  `/land-and-deploy` → `/canary`, with `/setup-deploy`/`/benchmark` as
  setup/baseline steps. `/ship` **mandatorily** dispatches a
  `/document-release` subagent before opening a PR — expect that to run,
  it's not optional. Never let this pipeline anywhere near live n8n/
  Supabase/VPS/DNS state — see "Route first" above.
- **Documenting a change** → `/document-release` (fires automatically
  inside `/ship`) / `/document-generate` (docs from scratch) — repo-
  technical docs only (README, inline docs). Never a substitute for a
  Wiki page or a `Wiki/log.md` entry — see Memory below.
- **iOS work** → Zenny has no iOS app; the `/ios-*` bundle is installed
  (no per-skill opt-out) but never invoked.
- **Everything else** (`/retro`, `/benchmark-models`, `/pair-agent`,
  `/make-pdf`, `/diagram`, `/scrape`, `/skillify`, `/codex`, `/spec`,
  `/plan-tune`, `/health`, `/landing-report`) — available ad hoc, not
  built into any default workflow. Invoke by name if asked for.

## Memory — tell gstack explicitly, don't let it guess

Zenny's Wiki + `PROJECT_STATE.md` are the sole system of record. **Never**
GBrain, `/setup-gbrain`, `/sync-gbrain`, `/context-save`, `/context-
restore`, or `/learn` for anything about this project — if a gstack
workflow needs project context, Grep/Read the Wiki directly instead of
reaching for gstack's own memory tooling. (GBrain is confirmed opt-in at
every layer — nothing installs or wires it without those commands being
run explicitly first, so skipping it costs nothing.) The one exception:
`/document-release`/`/document-generate` may write to the Dashboard
repo's own README/inline docs — that's repo-technical documentation, not
project-knowledge memory, and stays fine.

## The two seams — apply every time a gstack skill is invoked

1. **Stop-condition check before any self-chain fires** — real automatic
   chains exist (`/ship`'s mandatory `/document-release` dispatch,
   `/autoplan`'s unconditional sequential run). Before letting one fire:
   does this touch live n8n/Supabase/DNS/VPS? Is there an unresolved
   Credential Gate? Would this exceed the live-infra handoff safe-gate?
   If yes to any, stop and apply Zenny's rule instead of gstack's default
   next step.
2. **Standing-rule enforcement on gstack's output** — Credential Gate,
   Document Resolution Authority, Mandatory MCP Verification, and Per-
   Workflow Documentation don't exist in gstack's vocabulary. Apply all
   four to whatever a gstack skill produced before treating it as done.

## When gstack and a Zenny skill both plausibly fit

Check this skill's routing rules first — most real overlaps are already
decided above. If genuinely undecided, default to gstack per the
project's standing gstack-first-on-overlap preference, but flag the gap
so `Wiki/reference/gstack-skill-playbook.md` can be updated with a real
decision rather than leaving it to be re-guessed next time.
