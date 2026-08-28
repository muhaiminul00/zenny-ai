# gstack skill playbook — Commander's dispatch reference

Commander's reference sheet for deciding which `gstack` skill (or sequence of
skills) to invoke, and where Zenny's own existing skills/rules take
precedence instead. Written 2026-08-27, before install — this is the
*theoretical* interaction model, agreed with the human, not yet
live-verified. Advisor and Execute read this same page; neither keeps a
separate copy. See [[reference/role-modes-plugin]] and
[[reference/project-memory-plugin]] for the sibling mode/memory system this
sits alongside.

## What gstack actually is

Not infra, not a Claude Code plugin — a `git clone` of
`github.com/garrytan/gstack` into `~/.claude/skills/gstack` (+ `./setup`),
**machine-global**, not scoped to this project the way `role-modes`/
`project-memory` are. 23 skills wrapping Garry Tan's own Think→Plan→Build→
Review→Ship→Reflect discipline, plus GBrain (an optional persistent-memory
layer), browser automation, security review, and destructive-command
guardrails. Ships its own hook system (stop hooks, pre/post-tool-use hooks,
an auto-updater throttled to 1/hour on session start) — a third SessionStart
actor alongside `role-modes`'s hook and Zenny's own five wired hooks
(pip-guard, permission-fallback, post-edit, prompt-routing, session-end).
**A live hook-collision check is mandatory before this playbook is trusted
in practice** — same bug class BC-TOOL-007/008 already found once between
`role-modes` and `project-memory`.

Self-chaining is real and automatic, not optional: `/ship` auto-invokes
`/document-release`; `/autoplan` runs CEO→design→eng→DX with no described
human gate in between; `/office-hours`'s output is auto-picked-up by three
review skills. This is why Commander staying the outer gate (see "The two
seams" below) is load-bearing, not decorative.

Real-world caveat found during research (no substantive independent
criticism exists yet — the project is young, v0.15.x, 66K GitHub stars in
weeks, coverage is mostly promotional): the one recurring theme across
reviews is "skip the ones that don't fit your team." Garry Tan's own
productivity numbers (10k+ LOC/week, ~100 PRs/week) are unverified marketing
claims, not something to plan capacity around.

## The two seams (from the design discussion, made concrete here)

1. **Whose stop-conditions win.** Every gstack skill loads into *this same
   session* — not a subprocess — so Commander (the same agent throughout)
   can always choose not to follow a self-chaining instruction. The actual
   risk is following it on autopilot. Before letting any of the
   self-chaining points below fire, Commander explicitly re-checks: does
   this touch live n8n/Supabase/DNS/VPS? Is there an unresolved Credential
   Gate? Would this exceed the live-infra handoff safe-gate? If yes to any,
   stop and apply Zenny's rule instead of gstack's default next step.
2. **Who enforces Zenny's standing rules.** None of Credential Gate,
   Document Resolution Authority, Mandatory MCP Verification, or
   Per-Workflow Documentation exist in gstack's vocabulary. Commander
   applies all four to every gstack skill's output before treating it as
   done — same authority it already holds over Execute's output, redirected
   at gstack.

## Decision map — keep Zenny's own / adopt gstack's / coexist

| Area | Resolution |
|---|---|
| Build Card planning | gstack's `/office-hours` → `/plan-ceo-review` → `/plan-design-review` → `/plan-eng-review` (or `/autoplan` for the bundled run) generates the plan's *substance*; Commander still packages the result into a Build Card before Execute sees it. Build Card stays the interface to Execute. |
| Security review | `/cso` (OWASP Top 10 + STRIDE) — adopt outright, no Zenny equivalent existed. |
| Destructive-command guardrails | `/careful` / `/freeze` / `/guard` / `/unfreeze` — adopt outright, additive, no collision. |
| Code review | `/review` wins for the default pre-`/ship` pass (it's what feeds `/ship`'s Review Readiness Dashboard and auto-fixes obvious issues). `mattpocock-skills:code-review` stays available for ad-hoc use outside the pipeline, off the default path. |
| Debugging | `/investigate` wins — its 3-failed-attempts stop and auto-`/freeze` on the affected module are concrete safety properties the alternatives lack. Retires `superpowers:systematic-debugging` and `mattpocock-skills:diagnosing-bugs` from the Tool Routing Table's default path. |
| Browser / QA | `/browse`, `/qa`, `/qa-only`, `/setup-browser-cookies` supersede the Tool Routing Table's Playwright MCP row — `/qa` is diff-aware (auto-detects affected pages from `git diff`) and auto-generates regression tests, strictly more complete for this project's OAuth/dashboard-UI verification needs. |
| Dashboard design | **Split, not a straight replacement:** gstack's `/design-consultation` → `/design-shotgun` → `/design-html` handle greenfield generation (new screens/systems — fits "building almost from scratch"); Zenny's existing `taste-skill` + `brandkit` + `minimalist-skill` + `frontend-design` bundle is the judgment/critique gate gstack's output must pass before a design pass is called done; `impeccable` keeps the post-ship live-polish-audit job (existing Tool Routing Table row) — gstack's `/design-review` is skipped specifically to avoid two full live-audit passes over the same shipped UI. |
| Memory | Wiki + PROJECT_STATE.md stay the sole system of record. GBrain, `/setup-gbrain`, `/sync-gbrain`, `/context-save`, `/context-restore`, and `/learn` are all skipped — `/context-save` duplicates PROJECT_STATE.md's exact job, and `/learn`'s auto-biasing across sessions is the opposite instinct from Wiki's explicit "say so if no match, never synthesize" confidence rule. |
| Documentation | Wiki's Promotion Rule and the Per-Workflow Documentation standing rule stay authoritative. `/document-release` and `/document-generate` are usable only for the Dashboard repo's own README/inline docs — never a substitute for a Wiki page or a `Wiki/log.md` entry. |
| Deploy | `/ship` → `/land-and-deploy` → `/canary` → `/setup-deploy` → `/benchmark` are scoped to the **Dashboard repo only**. n8n/Supabase changes keep going through their own MCPs per the Credential Testing and Mandatory MCP Verification standing rules — this pipeline has no concept of either and must never be allowed near live n8n/Supabase/VPS/DNS state directly. This is where seam 1 matters most. |
| iOS skills (`/ios-qa`, `/ios-fix`, `/ios-design-review`, `/ios-clean`, `/ios-sync`) | Installed (it's a bundle, no per-skill opt-out), never invoked — Zenny has no iOS app. |
| Niche utilities (`/retro`, `/benchmark-models`, `/pair-agent`, `/make-pdf`, `/diagram`, `/scrape`, `/skillify`, `/codex`, `/plan-tune`) | Available but not built into any dispatch workflow — usable ad hoc if asked for by name. |

## Essential path (Zenny-adapted from gstack's own tiering)

gstack's own docs describe an "Essential Core Path"; the Zenny-scoped
version, cross-referenced against the decision map above:

1. `/office-hours` → `/plan-ceo-review` → `/plan-design-review` (dashboard
   work only) → `/plan-eng-review` — plan, reviewed on every dimension that
   applies. `/autoplan` is the bundled shorthand when a full run is wanted
   without stopping between each review.
2. Commander packages the result into a Build Card, applies the two seams,
   hands to Execute.
3. Execute implements. `/review` → `/investigate` (only if something's
   actually broken) verify correctness.
4. `/qa` (diff-aware) verifies behavior; `/cso` runs before shipping
   anything security-sensitive.
5. `/ship` → `/land-and-deploy` → `/canary` — **Dashboard repo only.**
   n8n/Supabase/VPS/DNS changes never enter this path; they go through
   their own MCPs, verified per the Mandatory MCP Verification rule, and
   documented per Per-Workflow Documentation.
6. `/careful`/`/guard` active by default near production; `/freeze` when
   debugging a specific module.

## Explicitly out of scope for Zenny (for now)

GBrain (redundant with Wiki, and a needless new Supabase/PGLite dependency
purely for memory — cuts against "minimize complexity"), the full
sprint-name vocabulary as a replacement for CLAUDE.md's own mode names, and
gstack's design-review/document-generate/context-save skills where they'd
duplicate a Zenny system that already does that job. Revisit only if a
specific gap appears that nothing in the decision map above already covers.

## Status

Theoretical model only, agreed with the human 2026-08-27, not yet installed
or live-verified. Install (`./setup`, global) + the SessionStart
hook-collision check + root `CLAUDE.md` Modes-section update are the next
Build Card, scoped to Execute (global tool install + git-write).
