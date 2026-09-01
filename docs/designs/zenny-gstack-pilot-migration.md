# Design: Migrate Zenny from `role-modes` to `gstack-pilot`

**Supersedes:** none — this is the first real design pass on the
"Zenny-migration decision" that PROJECT_STATE.md has logged as open/
deferred since 2026-08-30.

## Problem

Zenny runs plain `role-modes` (Advisor/Commander/Execute, no native gstack
awareness) plus a hand-written prose bridge in root `CLAUDE.md`
("Gstack planning bridge") that requires Commander to *manually remember*
to invoke a gstack skill and *manually re-derive* how its output composes
with Zenny's own standing rules, every single cycle. Two real symptoms of
this, both confirmed this session, not assumed:

1. Human's live complaint: gstack "isn't confident, isn't chaining
   itself" during Zenny builds — because nothing in plain `role-modes`
   ever self-invokes a gstack skill; a human (or Commander, remembering)
   has to name one every time.
2. Confirmed via grep: of gstack's 55 skills, Zenny's entire build history
   has only ever invoked 6 — the ones wired into CLAUDE.md's *mandatory*
   standing rules (`office-hours`, `plan-eng-review`, `plan-ceo-review`,
   `review`, `qa`, `ship`). `investigate` was invoked exactly once, ever,
   and only because a human explicitly asked for an audit
   (`Wiki/log.md` session-bc-2026-08-31-concurrency-hardening) — never
   self-triggered by Execute hitting a stuck point mid-task.

`gstack-pilot` (this repo, `E:\Programming\gstack-pilot`, v1.5.1) already
solves both: Commander natively chains into `office-hours` →
`plan-eng-review` → `autoplan` for planning; Execute natively chains into
`review` → `qa` → `ship` for wrap-up; and Execute's mid-run planning/
investigation chain (shipped v1.4.0) lets it self-invoke `investigate`/
`plan-eng-review`/`cso`/`office-hours` **once per task** when genuinely
stuck, with no human round-trip. It's built, released, and proven live on
`zm-brain` (3 real PRs through its full review pipeline). Zenny has simply
never adopted it.

## Decision locked (via `/plan-eng-review`, human-confirmed, 2 questions)

**Migrate Zenny's project-scoped plugin from `role-modes` to
`gstack-pilot`.** Confirmed as a clean swap, not a co-install — by design,
per gstack-pilot's own `hooks/session-start.js` header comment:
*"gstack-pilot is designed as role-modes' successor for a given project,
never expected to be co-installed alongside it"* — and its `mode.json`
schema (`{mode: "advisor"|"commander"|"execute"}`) is byte-identical to
role-modes', so the state file needs zero transformation.

**D1 — REVERSED after Outside Voice challenge (see cross-model tension
below): keep Zenny's trivial-housekeeping exemption.** Initially locked
as "drop the exemption, adopt gstack-pilot's PR-first-always default
as-is." Codex's outside-voice pass pushed back — a 1-line PROJECT_STATE
status update going through branch/PR/review/qa/ship is real overhead
with no corresponding safety gain, since there's no code risk in a status
line. Human reconsidered and reversed. **Final: gstack-pilot's own
`execute.md` gets one small, generic, portable addition — a
project-declarable override on the PR-first-always default, mirroring
the pattern its own file already uses for the Live-infra safe-gate
threshold** (*"stop... after 5 consecutive Build Cards... or fewer if
this project's CLAUDE.md overrides the number"*). Not a Zenny-specific
hardcode — any project using gstack-pilot can declare the same exemption
if it wants; Zenny's own root `CLAUDE.md` declares it, keeping its
existing Branch/PR Workflow standing rule's exemption line unchanged.
This is why "no change to gstack-pilot itself" below has been corrected —
see NOT in scope.

**D2 — Merge Zenny's two overlapping skill-routing references, same PR.**
Root `CLAUDE.md` already has a hand-authored "Tool Routing Table" and
gstack's own auto-injected "## Skill routing" flat table, self-flagged in
the file as pending exactly this merge. Since this migration is already
touching CLAUDE.md's gstack-related sections, folding the merge in now
avoids a second future "touch this file again" pass. **Not the same thing
as gstack-pilot's own seeded "Mode-gstack Bridge" section** (confirmed by
reading `hooks/session-start.js`'s seed block, lines 338-345): that
section covers the *mode-chain sequence* (which mode chains into which
skill, in what order); the Tool Routing Table / Skill-routing merge covers
*skill selection* (which skill handles a given request). Orthogonal,
both stay independent — do not conflate the two while executing this.

**D2 — held after Outside Voice challenge.** Codex called bundling the
Tool-Routing-Table/Skill-routing merge into this migration's PR
"opportunistic scope creep." Human reconsidered and held the original
call: CLAUDE.md is already being edited for D1/T2/T3 regardless, the
merge itself is small and low-risk (consolidating two already-known-
duplicate tables, not new content), and splitting it into a second PR
adds process overhead for its own sake.

**D3 — no version pin.** Codex flagged that `enabledPlugins` doesn't pin
gstack-pilot to v1.5.1 — plugin resolution floats to whatever the
marketplace currently serves. **Locked: no pin, accept floating.**
Consistent with Zenny's existing convention — none of its other plugins
(`role-modes` today, `superpowers`, `n8n-skills`, etc.) are version-pinned
either; pinning gstack-pilot alone would be a new, inconsistent policy
for one plugin, not a fix to a real inconsistency.

**TODO 1 & TODO 2 — deferred, not built now.** The human's two additional
raw ideas (mid-build fact-indexing as an automatic chain step; native
commands writing into `project-memory` conditionally) are genuinely
unmeasured — no project has hit either gap in practice yet. Logged as
full entries in `gstack-pilot`'s own `TODOS.md` (portable-plugin-level,
not Zenny-specific) rather than built or silently dropped. Same
"don't solve an unmeasured problem" standard this file's existing 3
entries already apply.

**TODO 3 resolved as N/A, not deferred.** `C:\Users\muhai\.claude\plans\
jazzy-plotting-marshmallow.md` ("role-mode-gstack") is not a sibling plan
— per human's direct correction, it's the pre-rename planning doc for
what became `gstack-pilot` itself. Fully superseded, nothing to reconcile.
No action needed beyond this note; the human may discard the stale plan
file at their convenience.

## What already exists (reused, not rebuilt)

- The entire native-chaining mechanism (Commander planning chain, Execute
  wrap-up chain, Execute mid-run chain) — `gstack-pilot` v1.5.1, already
  built and live-proven. Nothing new required for the core ask.
- `mode.json`'s schema and path (`.claude/hooks/state/mode.json`) — shared
  byte-for-byte between `role-modes` and `gstack-pilot` by design.
- Zenny's own `.claude/CLAUDE.md` Memory System record (raw Wiki, not
  `project-memory`) — gstack-pilot's Commander only recommends/asks
  "on first run in this project, if no memory system is recorded yet";
  Zenny's is already recorded, so this correctly no-ops (honored
  silently), confirmed by reading `commands/commander.md`.
- Zenny's own Standing Rules (Credential Gate, Document Resolution
  Authority, Per-Workflow Documentation, Mandatory MCP Verification,
  Wiki promotion rule) — gstack-pilot's `execute.md`/`commander.md`
  explicitly defer to *"this project's own protocol if its CLAUDE.md (or
  equivalent) defines one"* at every relevant point, and its own STOP
  conditions explicitly name "a credential gate" generically. Confirmed
  by direct quote, not assumed — these compose automatically, nothing to
  build.
- Zenny's own `.claude/hooks/post-edit.ps1` (PostToolUse) and
  `session-end.ps1` (SessionEnd) — project-scoped, mode-agnostic,
  reference neither `role-modes` nor `mode.json`. Confirmed by reading
  both in full — survive the swap untouched, coexist with gstack-pilot's
  own `SessionStart`/`PreToolUse`/`SessionEnd` hooks the same proven way
  they already coexist with `role-modes`' hooks today (same underlying
  Claude Code multi-hook-per-event mechanism, already verified working
  for `role-modes` per PROJECT_STATE.md 2026-08-29).
- Global marketplace registration for `gstack-pilot`
  (`~/.claude/settings.json`'s `extraKnownMarketplaces`) — already
  present, plugin already cached locally at v1.5.1
  (`~/.claude/plugins/cache/gstack-pilot/gstack-pilot/1.5.1/`). Only
  Zenny's *project-scoped* `enabledPlugins` entry needs to change.
- gstack-pilot's `buildCommanderBriefing()` (reads a `State Doc: <path>`
  line from `.claude/CLAUDE.md` and injects it at session start) — not
  currently usable by Zenny because `.claude/CLAUDE.md` doesn't declare
  that line yet. Free value-add once the seed block's fill-in-the-blank
  is completed (see Implementation Tasks).
- Claude Code's own plugin command namespacing — every plugin slash
  command is namespaced by plugin name (confirmed by gstack-pilot's own
  seeded text: *"a bare `/commander` will not resolve to this command"*).
  Answers Codex's "command-name collision" concern directly: `role-modes`'
  `/role-modes:commander` and gstack-pilot's `/gstack-pilot:commander`
  cannot collide even while `role-modes` stays installed-but-disabled.
- gstack-pilot's `seedClaudeMd()` sentinel gate (confirmed by source read,
  `hooks/session-start.js:312`): `if (fs.existsSync(sentinelFile)) return;`
  — the seed block is written **exactly once, ever**, then never touched
  again. Answers Codex's "editing the seed block's `State Doc:` line may
  fight future re-seeding" concern directly: there is no re-seeding to
  fight against T5's edit.

## NOT in scope

- Building either of TODO 1/TODO 2 now — deferred with reasoning above,
  tracked in gstack-pilot's `TODOS.md`, not silently dropped.
- A **large** change to `gstack-pilot` — corrected after Outside Voice
  caught the original overclaim. Real, small scope in that repo: one
  generic override point on the PR-first-always default (D1 reversal, a
  ~5-line addition to `execute.md` following the existing threshold-
  override pattern) plus 2 TODOS.md documentation entries. Everything
  else (mode.json schema, seeding mechanism, chain composition with
  Zenny's standing rules) needed zero changes, confirmed by source read.
- Reconciling `jazzy-plotting-marshmallow.md` further — resolved as N/A
  per human's direct correction, nothing left to reconcile.
- Migrating Zenny's `Wiki/reference/gstack-skill-playbook.md` content
  wholesale — it gets a status update (superseded, pointing here), not a
  rewrite; its historical narrative stays as the record of *why* the
  prose-only bridge existed and what led to replacing it.
- Any change to `zm-brain`'s own already-working gstack-pilot install —
  out of scope, unaffected by anything here.

## Verification plan (live-dogfood — no automated framework in this repo,
same precedent as every prior card; confirmed via loaded session learning
`zenny-repo-no-version-mechanism`)

```
FLOW                                  VERIFY
[+] enabledPlugins swap
  └─ SessionStart fires gstack-pilot's   [ ] Next session start: mode
     hook, not role-modes'                   instruction text says
                                             "gstack-pilot:commander" not
                                             "role-modes:commander"
[+] mode.json compatibility
  └─ existing {"mode":"commander"}       [ ] No reset to "advisor" —
     read by gstack-pilot's hook             confirms schema compat live,
                                             not just by source-reading
[+] CLAUDE.md seed block
  └─ appended once, sentinel-gated       [ ] .claude/CLAUDE.md gains the
                                             new block below the existing
                                             Memory System section, not
                                             overwriting it
[+] Commander planning chain
  └─ next real Build Card cycle          [ ] Commander self-chains into
                                             office-hours/plan-eng-review
                                             without a human naming the
                                             skill
[+] Execute wrap-up chain (D1)
  └─ next Execute task, ANY size         [ ] Even a trivial doc-only
                                             change goes branch -> PR ->
                                             review -> qa -> ship, not
                                             direct-to-main
[+] Execute mid-run chain
  └─ next genuine stuck-point            [ ] Execute self-invokes the
                                             matching gstack skill once,
                                             logs via gstack-decision-log,
                                             resumes without a human
                                             round-trip
[+] Zenny's own hooks (post-edit.ps1,
    session-end.ps1) still fire          [ ] Both PostToolUse/SessionEnd
                                             reminders still appear
                                             alongside gstack-pilot's own
```

No unit-test framework applies (docs/config repo, no application code) —
this IS the test plan, same shape as gstack-pilot's own Build Cards'
"Test Cases / Testing Instructions" sections.

## Failure modes

| Codepath | Failure | Handling | Silent? |
|---|---|---|---|
| `enabledPlugins` flipped but gstack-pilot not actually resolvable in this project (marketplace/cache gap) | Next session falls back to Claude Code's own "not installed" messaging; mode system stops working | T1's Verify step catches this at the very next session start | Should surface at session start — not independently confirmed against a real resolution failure this pass; treat as "expected visible," not proven |
| CLAUDE.md seed block double-appends (marker check fails somehow) | Duplicate "Mode-gstack Bridge" section | Guarded twice (sentinel file AND `existing.includes(marker)` check, confirmed by source read) — would require both guards failing simultaneously | Not silent — visible on next CLAUDE.md read |
| A future Build Card mid-migration needs `role-modes`-specific behavior no longer present | Confusion mid-task | `role-modes` stays installed-but-disabled (not deleted) — reversible in one settings.json edit if something is missed | Visible — Execute would hit unexpected instruction text and can flag it |
| Zenny's own PostToolUse/SessionEnd hooks vs. gstack-pilot's own SessionStart/PreToolUse/SessionEnd hooks emit conflicting guidance in the same run | Confusing/contradictory injected context | Not independently re-verified for THIS exact pairing — relying on the same underlying multi-hook-per-event mechanism already proven for `role-modes` + Zenny's hooks (Codex correctly flagged this as asserted, not re-proven for gstack-pilot specifically) | Would be visible in the session transcript (both hooks' text appears), but a real ordering/precedence conflict wouldn't necessarily be obvious — T7 must explicitly check this, not just "hooks fire" |
| D1's original PR-first-always plan would have made a genuinely tiny fix feel heavyweight | Friction | Resolved by the D1 reversal — moot | N/A |

No critical gap toward silent data loss or an unreviewable merge. Two
rows above are downgraded from the original draft's "not silent" claim to
"expected but not independently proven this pass," per Outside Voice —
both get explicit live checks in T7 rather than being asserted safe.

## Rollback plan (added after Outside Voice — original draft
under-specified this)

Reverting past T1 alone is insufficient once T2-T6 land (Codex's point).
Full rollback, in order: (1) restore root `CLAUDE.md`'s prior committed
version via `git revert` of the migration PR (covers T2/T3/T4 in one
step, since D1's reversal already means T3 makes no CLAUDE.md change);
(2) flip `.claude/settings.json` `enabledPlugins` back to
`"role-modes@role-modes": true`; (3) `.claude/CLAUDE.md`'s gstack-pilot
seed block and any T5 edit are left in place, inert — `role-modes` never
reads them, so no cleanup is required there; (4) revert
`Wiki/reference/gstack-skill-playbook.md`'s status-update commit. Because
this migration goes through the PR-first flow itself (once live), steps
1 and 4 are each a single `git revert` of a known commit — not a manual
reconstruction.

## Diagrams

```
BEFORE (plain role-modes + prose bridge)

  Human/Commander ──(must remember)──> names a gstack skill ──> gstack runs
       │                                                            │
       └────────────── everything else: never invoked ──────────────┘
                        (49 of 55 skills, incl. investigate,
                         used ~once ever, only on explicit ask)

AFTER (gstack-pilot native chain)

  Commander ──(auto)──> office-hours/plan-eng-review/autoplan ──> Build Card
                                                                       │
                                                                       v
  Execute ──(auto, pre-flight)──> implementation ──(stuck?)──> ONE mid-run
     │                                                          gstack skill
     │                                                          (investigate/
     │                                                           plan-eng-
     │                                                           review/cso/
     │                                                           office-hours)
     v
  Execute ──(auto, wrap-up, PR-first, no exemption)──> review -> qa -> ship
     │
     v
  Commander (auto handback)
```

## Worktree parallelization strategy

Sequential implementation, no parallelization opportunity — all steps
touch the same two files' worth of state (Zenny's `.claude/settings.json`
+ root `CLAUDE.md`) in a fixed order (swap plugin -> verify session start
-> rewrite CLAUDE.md sections -> verify chains live), single workstream.

## Implementation Tasks

- [ ] **T1 (P1, human: ~2min / CC: ~2min)** — config — Flip Zenny's
  `.claude/settings.json` `enabledPlugins`: remove
  `"role-modes@role-modes"`, add `"gstack-pilot@gstack-pilot"` (disable,
  don't uninstall role-modes — reversible per Failure modes table).
  - Files: `.claude/settings.json`
  - Verify: next session start shows `MODE: /gstack-pilot:commander`
    (or whatever mode `mode.json` already holds) in the injected context,
    not `role-modes:`.
- [ ] **T2 (P1, human: ~0 / CC: ~10min)** — docs — Retire root
  `CLAUDE.md`'s "Gstack planning bridge" subsection (under Commander →
  Execute auto-handoff) and its "Commander → Execute auto-handoff"
  references to it — gstack-pilot's `commander.md`/`execute.md` now do
  this natively. Keep the "Gstack planning bridge (adopted 2026-08-29)"
  historical framing minimal (one line: superseded by native chaining via
  `gstack-pilot`, see Wiki) rather than deleting the paragraph outright,
  so the decision history stays legible.
  - Files: `CLAUDE.md` (root)
  - Acceptance criteria (Outside Voice: the original draft didn't define
    this precisely enough): every sentence in the section that
    instructs Commander to *act* (invoke a specific skill, re-derive how
    output composes with standing rules) is removed or reduced to a
    one-line "superseded 2026-09-01, see Wiki" pointer; sentences that
    are purely *historical record* (why the bridge was adopted
    2026-08-29, the BC-072 incident that motivated it) stay, unedited,
    as record — never silently deleted.
  - Verify: re-read the section after editing against the acceptance
    criteria above; no remaining prose an Execute/Commander session
    would actually try to follow as a live instruction.
- [ ] **T3 (P1, human: ~0 / CC: ~10min)** — plugin repo — Apply D1
  (reversed): add a generic, project-declarable override on gstack-pilot's
  PR-first-always default, mirroring the existing Live-infra safe-gate
  threshold override pattern in the same file.
  - Files: `E:\Programming\gstack-pilot\commands\execute.md` (the
    "Gstack wrap-up chain, PR-first, no trivial-housekeeping exemption"
    paragraph) — real change in a DIFFERENT repo from the rest of this
    task list, ships as its own gstack-pilot patch release (version bump
    + tag/release, same discipline as every prior gstack-pilot Build
    Card), not bundled into Zenny's own commit.
  - Then in Zenny: leave root `CLAUDE.md`'s Branch/PR Workflow standing
    rule's trivial-housekeeping exemption exactly as it already reads —
    no edit needed there once gstack-pilot honors it.
  - Verify: re-read `execute.md` after the edit — the override clause is
    present, narrow (declared-per-project, not a global weakening), and
    every other project using gstack-pilot (e.g. `zm-brain`) keeps
    PR-first-always by default since it never declares the exemption.
- [ ] **T4 (P2, human: ~0 / CC: ~15min)** — docs — Apply D2: merge the
  hand-authored "Tool Routing Table" and gstack's auto-injected "## Skill
  routing" section into one table. Do not touch/merge gstack-pilot's own
  seeded "Mode-gstack Bridge" section once T1 lands it — orthogonal,
  confirmed above.
  - Files: `CLAUDE.md` (root)
  - Verify: one routing reference remains, no content silently dropped
    from either source table.
- [ ] **T5 (P2, human: ~0 / CC: ~5min)** — docs — Fill in gstack-pilot's
  seeded CLAUDE.md block's `State Doc:` line with `PROJECT_STATE.md`,
  activating the free Commander pre-session briefing. **Sequencing
  correction (Outside Voice caught this): this is NOT part of the same
  linear edit pass as T1-T4.** The seed block only exists after
  gstack-pilot's `SessionStart` hook has actually fired once post-T1 —
  T5 is the FIRST task of the FOLLOWING session, not a same-sitting step.
  - Files: `.claude/CLAUDE.md`
  - Verify: confirm the seed block is present before editing (read the
    file first — do not assume/pre-create it); then confirm the next
    Commander session after that shows the briefing excerpt in injected
    context.
- [ ] **T8 (P1, human: ~0 / CC: ~10min)** — verification — Repo-wide
  scan for stale `role-modes` references before/alongside T2-T4 (Outside
  Voice flagged the original file list as under-inventoried): grep Zenny
  for `role-modes`, `/role-modes:`, and mode-name references outside
  `.claude/settings.json`/`CLAUDE.md` (docs, other Wiki pages, scripts)
  to confirm nothing else assumes the old plugin is active.
  - Files: repo-wide grep, fix whatever it finds
  - Verify: grep comes back clean, or every hit is explicitly triaged
    (historical narrative left alone vs. live reference fixed).
- [ ] **T6 (P1, human: ~0 / CC: ~10min)** — docs — Update
  `Wiki/reference/gstack-skill-playbook.md`: mark the prose-only-bridge
  design as superseded, point to this design doc and the migration's
  Wiki entry, keep the historical narrative intact (why it existed,
  what led to replacing it).
  - Files: `Wiki/reference/gstack-skill-playbook.md`
  - Verify: reader lands on "this was superseded 2026-09-01, see X" not
    stale current-state prose.
- [ ] **T7 (P1)** — wrap-up — Live-verify every row in the Verification
  plan table above, across the next real session/Build Card cycle (not
  all verifiable synchronously in this planning pass). Standard Zenny
  wrap-up (PROJECT_STATE.md status line, Wiki entry citing this design
  doc, `Wiki/log.md` entry) — through gstack-pilot's own PR-first chain,
  per D1, once it's live.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | ISSUES FOUND | 15 findings; 3 substantive cross-model tensions (D1, D2, version pin), rest folded as mechanical fixes (T5 sequencing, T8 grep sweep, rollback plan, acceptance criteria, 2 refuted via source-verified facts) |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 2 architecture decisions (D1 reversed after Outside Voice, D2 held after Outside Voice) + D3 (no version pin) + 2 TODOS logged to gstack-pilot's own TODOS.md, not built |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**CODEX:** flagged 15 issues against the initial draft; 3 were real cross-model
tensions against locked decisions (all re-litigated with the human, 1 reversed —
D1), the rest were legitimate coverage/precision gaps folded directly into the
plan (T5 sequencing fix, T8 repo-wide grep sweep, rollback plan, T2 acceptance
criteria, failure-mode wording softened) or refuted with source-verified quotes
(command namespacing, seed-block one-time-only write).

**CROSS-MODEL TENSION:**
```
D1 (PR-first-always vs. trivial-housekeeping exemption): Eng review recommended
  dropping Zenny's exemption. Codex called it "process replacing judgment."
  Human reconsidered and REVERSED — exemption kept, via a new generic
  project-declarable override point added to gstack-pilot's own execute.md
  (not a Zenny-specific hardcode).

D2 (Tool Routing Table merge, same PR): Eng review recommended merging now.
  Codex called it "opportunistic scope creep." Human reconsidered and HELD
  the original call — merge stays in this same PR.
```

**VERDICT:** ENG CLEARED — ready to package into a Build Card and hand to
Execute. (CEO/Design/DX reviews not applicable — infra/tooling-only
migration, no product surface, no UI.)

NO UNRESOLVED DECISIONS
