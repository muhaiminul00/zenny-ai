# gstack skill playbook — Commander's dispatch reference

Commander's decision-record for which `gstack` skill (or sequence of
skills) to invoke, and where Zenny's own existing skills/rules take
precedence instead. Written 2026-08-27 (theoretical), installed and
live-verified 2026-08-29 (a full research pass read all 55 skill files
against this page's claims — several corrections below replace earlier
guesses). The actual day-to-day dispatch mechanism is
`.claude/skills/using-gstack/SKILL.md`, not this page — this page is
the durable *why* behind that skill's routing rules. See
[[reference/role-modes-plugin]] and [[reference/project-memory-plugin]]
for the sibling mode/memory system this sits alongside.

## What gstack actually is

Not infra, not a Claude Code plugin — a `git clone` of
`github.com/garrytan/gstack` into `~/.claude/skills/gstack` (+ `./setup`),
**machine-global**, not scoped to this project the way `role-modes`/
`project-memory` are (human declined `--team`/project-scoped install
2026-08-29 — revisit after Phase 3). **Actually 55 skills, 76 browse
commands** (live-verified at install, `gen-llms-txt` output) — the
"23-skill" figure in earlier research was wrong, corrected here. Each
skill is its own subdirectory with a generated `SKILL.md` directly under
`~/.claude/skills/gstack/` — Claude Code auto-discovers and surfaces
them the moment the repo is cloned, same mechanism as any other skill
(confirmed: the router skill appeared in the available-skills list
immediately after `git clone`, before `./setup` even ran). Wraps Garry
Tan's own Think→Plan→Build→Review→Ship→Reflect discipline, plus GBrain
(an optional persistent-memory layer), browser automation, security
review, and destructive-command guardrails.

**Hook-collision check, live-verified 2026-08-29 (global, non-team
install):** `~/.claude/settings.json` has zero gstack hook entries —
grepped in full, no matches. No collision with `role-modes`'s hook or
Zenny's own wired hooks for this install mode.

**Superseded same day — team mode now actually ON, machine-wide, not
declined anymore.** `--team` was run for real (not on Zenny's behalf —
triggered by the separate `gstack-pilot` plugin work, to close that
plugin's own hook-coexistence gap with real evidence) — this is a
**global** change, so it affects every project on this machine,
Zenny included, from this point on:
- `~/.gstack/config.yaml`: `team_mode: true`, `auto_upgrade: true`.
- `~/.claude/settings.json`: a new `SessionStart` entry
  (`_gstack_source: "gstack-session-update"`, no matcher = fires every
  session, throttled internally to once/hour) and a new `Stop` entry
  (`_gstack_source: "gstack-timeline-stop"`) — both confirmed appended
  additively alongside every pre-existing entry (5 other `SessionStart`
  entries from `codebase-memory-mcp`, untouched), valid JSON before and
  after, live-diffed not assumed.
- Real, disclosed side effect for Zenny specifically: gstack will now
  silently self-update at the start of Zenny's own sessions too (same
  machine-wide hook, not project-scoped) — worth knowing if a future
  session finds gstack behaving differently than a prior Wiki entry
  described; check `gstack-config get` for current state rather than
  assuming this page is still current.
- No repo (Zenny's or otherwise) was `gstack-team-init`'d — that
  per-repo bootstrap step (writes into a target repo's own `CLAUDE.md`
  + a `PreToolUse` hook) was NOT run against Zenny. Only the global
  `--team` toggle changed.

**Self-chaining, corrected 2026-08-29 against the real skill files** (a
research pass read all 55 `SKILL.md` files — the claims below replace an
earlier, less precise version of this paragraph):
- **`/ship` mandatorily dispatches a `/document-release` subagent** at
  its Step 18, before the PR is created — explicit "you are NOT done"
  language, only a *failed* subagent run is non-blocking. This is a real
  automatic chain.
- **`/autoplan` is a real, unconditional sequential chain**: it reads and
  runs `plan-ceo-review` → `plan-design-review` (only if UI scope
  detected) → `plan-eng-review` → `plan-devex-review` (only if DX scope
  detected), auto-answering most questions via 6 encoded decision
  principles instead of surfacing them all.
- **`/office-hours`'s output is NOT auto-picked-up by anything** — this
  was wrong in an earlier version of this page. Its own text says "use
  before /plan-ceo-review or /plan-eng-review"; downstream skills read
  its design-doc file if a human chooses to run them next, but nothing
  invokes them automatically.
- **`/investigate`'s "auto-freeze" is a re-implementation, not a
  skill-to-skill call**: it directly writes the same freeze-dir state
  file `/freeze` uses and registers the same hook script, rather than
  invoking `/freeze` via the Skill tool. Functionally equivalent, worth
  knowing mechanically.
- **`/guard` does not invoke `/careful` and `/freeze`** — it duplicates
  their exact hook-script registrations itself. All three end up wiring
  the identical two hook scripts either way.

This is why Commander staying the outer gate (see "The two seams" below)
is load-bearing, not decorative — real automatic chains exist (`/ship`,
`/autoplan`), even though several things once assumed to be automatic
here turned out to be manual handoffs between skills that just share a
data file.

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
| Build Card planning | **Mandatory bridge, not optional (adopted 2026-08-29 — see Status below):** every time Execute hands work back to Commander, Commander's next action is a short prompt to the fitting gstack skill (`/office-hours`, `/plan-ceo-review`/`/plan-eng-review`, or `/autoplan` for the bundled run) — never drafting the next Build Card's plan itself. gstack generates the plan's *substance*, including (for infra cards) a build-ready spec down to node/table/RPC level with edge cases pre-resolved; Commander packages the result into a Build Card before Execute sees it. Build Card stays the interface to Execute. |
| Security review | `/cso` (OWASP Top 10 + STRIDE) — adopt outright, no Zenny equivalent existed. |
| Destructive-command guardrails | `/careful` / `/freeze` / `/guard` / `/unfreeze` — adopt outright, additive, no collision. |
| Code review | `/review` wins for the default pre-`/ship` pass. **Live-tested 2026-08-29:** found it hard-requires a remote literally named `origin` and a real branch-vs-base diff — Zenny's remote was `zenny-sync` and work landed direct-to-`main`, so a first run correctly reported "Nothing to review" and stopped rather than fake a pass. **Resolved the same day, not left open:** human approved adopting a real branch/PR workflow specifically to make this work (see Status below and `CLAUDE.md`'s Standing Rule — Branch/PR Workflow) — remote renamed `zenny-sync` → `origin`, feature-branch → PR → `/review` → `/ship` is now the live default for substantive work. `mattpocock-skills:code-review`/`simplify` stay available for ad-hoc use outside a PR. |
| Debugging | `/investigate` wins — its 3-failed-attempts stop and auto-`/freeze` on the affected module are concrete safety properties the alternatives lack. Retires `superpowers:systematic-debugging` and `mattpocock-skills:diagnosing-bugs` from the Tool Routing Table's default path. |
| Browser / QA | `/browse`, `/qa`, `/qa-only`, `/setup-browser-cookies` supersede the Tool Routing Table's Playwright MCP row — `/qa` is diff-aware (auto-detects affected pages from `git diff`) and auto-generates regression tests, strictly more complete for this project's OAuth/dashboard-UI verification needs. |
| Dashboard design | **Split, not a straight replacement:** gstack's `/design-consultation` → `/design-shotgun` → `/design-html` handle greenfield generation (new screens/systems — fits "building almost from scratch"); Zenny's existing `taste-skill` + `brandkit` + `minimalist-skill` + `frontend-design` bundle is the judgment/critique gate gstack's output must pass before a design pass is called done; `impeccable` keeps the post-ship live-polish-audit job (existing Tool Routing Table row) — gstack's `/design-review` is skipped specifically to avoid two full live-audit passes over the same shipped UI. |
| Memory | Wiki + PROJECT_STATE.md stay the sole system of record. GBrain, `/setup-gbrain`, `/sync-gbrain`, `/context-save`, `/context-restore`, and `/learn` are all skipped — `/context-save` duplicates PROJECT_STATE.md's exact job, and `/learn`'s auto-biasing across sessions is the opposite instinct from Wiki's explicit "say so if no match, never synthesize" confidence rule. **Confirmed low-risk to skip cleanly (2026-08-29 research):** GBrain is opt-in at every layer — nothing installs it, wires an MCP server, or writes anything to a project's CLAUDE.md without `/setup-gbrain`/`/sync-gbrain` being run explicitly first, and `/sync-gbrain` only writes its CLAUDE.md block after a live round-trip test passes (removes it if the test fails). `/context-save`/`/context-restore`/`/learn` are fully independent of GBrain — plain local files, not a reason to reconsider skipping GBrain itself. |
| Documentation | Wiki's Promotion Rule and the Per-Workflow Documentation standing rule stay authoritative. `/document-release`/`/document-generate` update the Dashboard repo's own README/Diataxis-style docs — never a substitute for a Wiki page or a `Wiki/log.md` entry. **Correction (2026-08-29 research):** `/document-release` is not merely "usable" — `/ship`'s Step 18 *mandatorily* dispatches it before opening a PR, so it fires automatically every time `/ship` is used. That's fine under this row's existing split (it only ever touches repo-technical docs, never Wiki/PROJECT_STATE.md), but Commander should expect it to run, not treat it as an optional add-on. |
| Deploy | `/ship` → `/land-and-deploy` → `/canary` → `/setup-deploy` → `/benchmark` are scoped to **Dashboard changes only** — **correction, 2026-08-29:** the Dashboard is a subfolder of this same repo (`05_Platform_Builds/Dashboard/`), not a separate repository as earlier phrasing implied; the scope boundary is by changed path, not by repo. n8n/Supabase changes keep going through their own MCPs per the Credential Testing and Mandatory MCP Verification standing rules — this pipeline has no concept of either and must never be allowed near live n8n/Supabase/VPS/DNS state directly. This is where seam 1 matters most. |
| iOS skills (`/ios-qa`, `/ios-fix`, `/ios-design-review`, `/ios-clean`, `/ios-sync`) | Installed (it's a bundle, no per-skill opt-out), never invoked — Zenny has no iOS app. |
| Niche utilities (`/retro`, `/benchmark-models`, `/pair-agent`, `/make-pdf`, `/diagram`, `/scrape`, `/skillify`, `/codex`, `/plan-tune`) | Available but not built into any dispatch workflow — usable ad hoc if asked for by name. |

## Essential path (Zenny-authored — correction below)

**Correction, 2026-08-29:** an earlier version of this page claimed
gstack's own docs describe an "Essential Core Path." A full research
pass grepped every doc file in the gstack repo (README, ARCHITECTURE,
AGENTS, ETHOS, CLAUDE.md, USING_GBRAIN, everything under `docs/`) for
that phrase and found **zero matches — it does not exist in gstack's
docs.** That claim was fabricated, likely by conflating README's actual
"Quick start" section (a 6-step first-time-trial sequence: install →
`/office-hours` → `/plan-ceo-review` → `/review` → `/qa` → "stop there,
you'll know if this is for you") with a permanent tiering doctrine that
was never there. The sequence below is **Zenny's own construction**,
built from the real decision map above — not sourced from gstack, and
should never have been presented as if it were.

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
5. `/ship` → `/land-and-deploy` → `/canary` — **Dashboard changes only**
   (a subfolder of this repo, not a separate one — see Deploy row above).
   n8n/Supabase/VPS/DNS changes never enter this path; they go through
   their own MCPs, verified per the Mandatory MCP Verification rule, and
   documented per Per-Workflow Documentation.
6. `/careful`/`/guard` active by default near production; `/freeze` when
   debugging a specific module.

## The dispatch mechanism: a real skill, not a CLAUDE.md block

Static markdown has to be remembered and cross-referenced manually; a
real Claude Code skill (its own `SKILL.md`, `name:`/`description:`
frontmatter) auto-surfaces in the available-skills listing every
session — the same mechanism that made gstack's own router skill appear
the instant it was cloned, before `./setup` even ran, and the same
pattern `n8n-skills:using-n8n-skills-official` and
`superpowers:using-superpowers` already use in this project. gstack's
own root `SKILL.md` demonstrates the exact template: frontmatter with
trigger phrases, a "route first" override check, a flat bullet list of
"trigger phrase → invoke this skill" rules, an explicit proactivity
gate (auto-invoke vs. suggest-only, user-toggleable, biased toward
over-routing — "a false positive is cheaper than a false negative"),
and best-effort routing telemetry. gstack's own dev `CLAUDE.md` shows
the same pattern a second way — a routing-rules list embedded directly
in CLAUDE.md text, for its own repo's dev workflow. Neither document
describes a convention for a *host project's own* router sitting above
gstack's — this repo's `.claude/skills/using-gstack/SKILL.md` is built
by analogy to gstack's own template, not from a documented gstack
convention.

## Explicitly out of scope for Zenny (for now)

GBrain (redundant with Wiki, and a needless new Supabase/PGLite dependency
purely for memory — cuts against "minimize complexity"), the full
sprint-name vocabulary as a replacement for CLAUDE.md's own mode names, and
gstack's design-review/document-generate/context-save skills where they'd
duplicate a Zenny system that already does that job. Revisit only if a
specific gap appears that nothing in the decision map above already covers.

## Status

**Installed 2026-08-29** (global, `~/.claude/skills/gstack`, non-team) —
hook-collision check clear (see above). **Phase 3 dispatch-model
rewrite complete 2026-08-29** (commit `a309460`): `.claude/skills/
using-gstack/SKILL.md` built (real auto-surfacing router), CLAUDE.md's
`## gstack` section shrunk to a pointer at it, Tool Routing Table rows
updated, 3 hooks retired (`prompt-routing.ps1` superseded by the new
skill; `pip-guard.ps1`/`permission-fallback.ps1` converted to plain
CLAUDE.md instructions).

**Post-integration validation, 2026-08-29:** ran `/review` for real
against the dispatch-rewrite commit to confirm the routing actually
works, not just that it's documented. Found the structural gap recorded
in the Code review decision-map row above (`origin` remote + PR/branch
workflow assumed, neither existed) — a real, disclosed limitation, not
a pass/fail on the skill itself. Flagged to the human as an open
workflow decision rather than self-resolved.

**Resolved the same day — branch/PR workflow adopted, 2026-08-29:**
human's explicit call ("adopt it... full potential of gstack... that's
the production grade approach"). Remote renamed `zenny-sync` → `origin`
(push/fetch/`origin/HEAD` all re-verified live under the new name).
New Standing Rule — Branch/PR Workflow in root `CLAUDE.md`: substantive
work goes feature-branch → PR → `/review` → `/ship`; trivial Wiki/log/
PROJECT_STATE-only housekeeping stays direct-to-`main`. **Live-proved
end to end, not just declared:** branch `feat/gstack-branch-pr-workflow`
carrying this exact workflow-adoption change was pushed, a real PR
opened via `gh pr create`, and `/review` run against it — see the PR/
commit referenced in `Wiki/log.md` session-gstack-branch-pr-workflow for
the actual result (confirms whether it found the diff correctly this
time, what it flagged, and how the PR was closed).

**Gstack-first planning bridge made mandatory, 2026-08-29 (same session
as BC-072):** human's explicit call — after BC-072 hit an architecture
mismatch (schema-per-client vs RLS) live, mid-build, human directed
that Commander→Execute self-chaining route through gstack's planning
skills on every cycle, not just on request. Root `CLAUDE.md`'s
"Commander → Execute auto-handoff" section now names this the "Gstack
planning bridge": Commander prompts gstack with what Execute just did
and what's next, gstack produces the plan, Commander translates it into
a Build Card. Scope stays exactly as the decision map above already
drew it — gstack has no n8n/Supabase/VPS/DNS MCP tools, so it plans
infra builds but never performs them; Execute still authors and runs
every infra build, and still owns Dashboard-code authorship even where
`/review`→`/ship` (gstack's one real execution-shaped path) owns that
domain's release ceremony.

**Still open, kept-for-now per human decision (revisit when asked):** 4
skill/plugin pruning candidates — `neon`/`neon-postgres`, `skill-creator`,
`andrej-karpathy-skills`, `playwright`.

Bun (`~/.bun/bin`, v1.4.0) was installed as a prerequisite (gstack's
setup requires it, wasn't already present); a `bunx` shim
(`~/.bun/bin/bunx` → `bun x "$@"`) was added since this bun build didn't
ship a separate `bunx` binary and `./setup`'s Playwright-install step
calls it by name.
