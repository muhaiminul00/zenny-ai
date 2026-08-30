# gstack-pilot plugin — role-modes natively chained into gstack

New sibling plugin (not a fork) to [[reference/role-modes-plugin]],
built 2026-08-29 for the new "ZM — Company Brain" project, not for
Zenny — Zenny keeps running plain `role-modes` + gstack global/non-team
install unchanged for now, migrating onto this plugin only later, once
proven live on Company Brain (Phase 3, not yet started, not designed).

- **Location:** `E:\Programming\gstack-pilot`, local git repo, and now
  **live and public: `github.com/muhaiminul00/gstack-pilot`**. Renamed
  from an initial working name of `role-mode-gstack` (human didn't like
  it) before anything was pushed — the single commit was amended in
  place, not layered with a second rename commit.
- **Phase 2 slice 1 (publish) done, 2026-08-29:** human created the
  GitHub repo, pushed by Execute (`80db797` → README rewrite `3bf3bc1`
  → main). Real repo description set via `gh repo edit`. Production-
  grade README written (full value prop, complete install sequence,
  worked usage-transcript example, kept the accurate composition-
  mechanism/design-constraint sections rather than a blind rewrite).
  **v0.1.0 tagged and released** (`gh release create`, matched to the
  exact commit on `main` - live-verified, not just "the command didn't
  error": tag SHA == `origin/main` HEAD, `isDraft`/`isPrerelease` both
  false, `plugin.json`'s version readable at the tagged commit, no
  duplicate version in `marketplace.json`). **Deliberately v0.1.0, not
  v1.0.0** - the hook-coexistence gap from Phase 1 was still open and
  disclosed in the release notes themselves, not glossed over for a
  cleaner-looking 1.0 tag.
- **v1.0.0 released same day, gap closed for real** - see
  `session-gstack-team-mode-enabled` in `Wiki/log.md` for the full
  narrative (human ran gstack's real `--team` setup against the actual
  global environment, live-diffed `~/.claude/settings.json`/
  `~/.gstack/config.yaml` before/after, confirmed additive not
  destructive). `plugin.json` bumped `0.1.0` → `1.0.0`, tagged, released
  (`048eb8b`), same live-verification discipline as v0.1.0.
- **Real target repo populated + gstack-team-init'd, 2026-08-30** - the
  actual Company Brain repo, `github.com/muhaiminul00/zm-brain` (local:
  `E:\Programming\ZenoManual - Compnay Brain`), pushed as-is (56 files,
  no restructuring) and `gstack-team-init required` run for real against
  it (append-only, confirmed not to touch the project's own existing
  Hard Rules). See `session-zm-brain-onboarding` in `Wiki/log.md`.
- **Human ran the plugin installs + first real verification pass,
  2026-08-30 — genuine first-use findings, one real fix shipped:**
  4 of 6 verification items passed clean. **Item 3/4 (memory-system
  check + `.project-memory/` scaffold) "failed" only because the first
  `/gstack-pilot:commander` invocation was bare** (no argument) - per
  the command's own explicit rule, a bare invocation confirms the mode
  switch and stops, so the memory check correctly never got a turn to
  fire yet. Not a bug; re-running with real work triggered it correctly
  (`project-memory` auto-recommended, scaffolded, sentinel files
  coexist cleanly with gstack-pilot's own, no collision).
- **Item 5 (real chain test) found a real, fixed gap:** asked to plan
  "propose reviving the Technical Architecture phase" (already named as
  a next step in that project's own frozen master plan) - misrouted to
  `office-hours` instead of `plan-eng-review`, because "propose"
  pattern-matches gstack's own office-hours trigger language. **Nothing
  executed on the wrong branch** (no `AskUserQuestion`, no side effects)
  - self-corrected before acting, which is the chain mechanism's safety
  property working as intended, not luck. Fixed: `commander.md`'s
  branch-selection criterion sharpened with an explicit disambiguator
  (prior-document-names-it-as-scoped wins over surface phrasing like
  "propose"/"consider"/"revive"). `hooks/session-start.js` checked - no
  change needed, already defers detail correctly. **v1.0.1 released**
  (`829cd00`), same live-verification discipline as prior releases.
- **`check-gstack.sh` PreToolUse hook confirmed working** (item 6) -
  never blocked any of the above, gstack resolved correctly throughout.
- **Plugin-declaration portability gap found + fixed in `zm-brain`,
  2026-08-30 (not a `gstack-pilot` code change):** confirmed against
  official docs that `extraKnownMarketplaces` in a committed project
  `.claude/settings.json` DOES auto-register for a teammate on folder-
  trust, but had gone to the human's global settings instead of the
  project's - fixed by copying the real marketplace-source shape in.
  Also found, and correctly did NOT touch or commit, a serious
  unrelated finding: `zm-brain`'s root `CLAUDE.md` was then missing 3
  sections (Current task, Hard Rules, Definition of done) locally vs.
  its last commit - flagged to the human, not silently fixed or
  committed either way. See `session-zm-brain-plugin-declaration-fix`
  in `Wiki/log.md` for the full narrative.
- **`CLAUDE.md` fully rewritten + run through the real gstack PR/review
  pipeline, 2026-08-30 - Phase 2 genuinely complete:** the deletion
  above confirmed intentional; human asked for a proper governance
  `CLAUDE.md` mirroring Zenny's own pattern. Built (grounded in real
  project docs, not invented), then actually run through the full
  Branch/PR Workflow the new file itself states as this project's own
  rule - PR #1, gstack's real `review` skill fired (surfaced a real
  onboarding gate, routing-rules injection, handled via
  AskUserQuestion; found and auto-fixed one real issue - a reference
  to a document, `marked_for_technical_architecture.md`, that doesn't
  actually exist anywhere in the repo, verified via find/grep), merged
  for real. See `session-zm-brain-claude-md-rewrite` in `Wiki/log.md`.
- **README.md fixed + onboarding pointer added, same day, PR #2:**
  found the `marked_for_technical_architecture.md` false-existence
  claim actually originated in README.md itself (`CLAUDE.md` had
  inherited it) - fixed at the source. Added a short "Working in this
  repo" pointer to `CLAUDE.md`. Second real pass through the pipeline:
  scope-drift detection correctly flagged an unrelated, uncommitted
  file-move sitting in the repo (not touched, flagged for the human).
  Review found zero issues on the actual diff. Merged (`9f9049b`). See
  `session-zm-brain-readme-update` in `Wiki/log.md`.
- **Canonical docs re-framed as reference baseline, same day, PR #3:**
  human's real concern - "frozen" (July 2026) only means internally
  complete, not still current; the plan/market have moved since. Added
  a note to `CLAUDE.md`'s Canonical Documents section stating the set
  is a reference starting point for Technical Architecture, requiring
  real re-verification via gstack's `plan-eng-review`/`office-hours`
  before building - separate from, doesn't touch, Document Resolution
  Authority (internal doc-to-doc precedence). Third pass through the
  pipeline: scope-drift flagged the same known uncommitted file-move a
  third time, consistent, still untouched. Zero findings. Merged
  (`ca737b4`). See `session-zm-brain-reverify-note` in `Wiki/log.md`.
- **`TEAM_SETUP.md` + `VERIFICATION_CHECKLIST.md` added to
  `gstack-pilot` itself, same day:** human raised whether install
  commands should use `!command` syntax for Claude-side retry -
  corrected (that's a chat-local convention, not a README mechanism);
  real fix is a prompt handed to Claude for the shell-runnable gstack
  install (retry-capable), kept separate from the 4 `/plugin
  marketplace add`/`/plugin install` lines (no tool-equivalent exists,
  must be human-typed). Also found and flagged, not fixed pending
  go-ahead: README's "v1.0.0"/"not yet run against a real team
  project" lines are now stale. Committed `ba07da8`. See
  `session-gstack-pilot-team-docs` in `Wiki/log.md`.
- **Stale README claims fixed, same day:** v1.0.0 → v1.0.1 (with the
  real patch reason), `## Status` rewritten from a false "not yet run
  against a real team project" to the actual proof (3 real PRs on
  `zm-brain`, 2 real findings fixed, 3 correct scope-drift detections).
  Committed `6bd50d9`. **This closes out the `gstack-pilot` initiative
  end to end** - built, released, live-proven, accurately documented,
  team-onboarding docs in place. See `session-gstack-pilot-readme-
  status-fix` in `Wiki/log.md`.
- **Build Card BC-2026-08-31 shipped, 2026-08-31 — Execute pre-flight
  sync gate + live PR-scope collision check, hook-enforced.** Full chain
  run before build: `office-hours` → `plan-eng-review` (3 adversarial
  review rounds + 1 Codex outside-voice pass) locked the architecture
  first — design doc `docs/designs/sync-gate-and-collision-check.md`
  (APPROVED). Closes the gap where a resumed or fresh Execute session
  had no git-freshness awareness at task start: could branch from a
  stale base, work over a dirty tree, or collide with an already-open
  PR touching the same files, with nobody any the wiser until a merge
  conflict. **Enforcement is structural, not prose** — a new
  `PreToolUse` hook blocks any file-mutating tool call until a valid
  `.claude/hooks/state/preflight-ok` marker exists for the current
  branch, written only by a new deterministic script
  (`scripts/pre-flight-sync.js`) after dirty-tree/stale-base/collision
  checks pass; a corrupted or unparseable marker fails closed (treated
  as missing), non-negotiable per the Failure Modes review. This was a
  real user override of the initially-recommended design — the outside-
  voice review argued prose-only enforcement doesn't guarantee the gate
  "runs every time," and the human chose the stronger, more expensive
  hook mechanism over the cheaper prose-consistent option.
  - **Files touched (7 scoped + 3 necessitated):**
    `scripts/pre-flight-sync.js` (new), `hooks/pre-tool-use.js` (new) +
    `hooks/hooks.json`, `commands/execute.md`, `hooks/session-start.js`
    (so a *resumed* session also sees the requirement, not just a fresh
    one), `skills/build-cards/SKILL.md` (new `Scope` field, genuinely
    new schema — no such field existed before), `TEAM_SETUP.md` (`gh`
    CLI install step), `.claude-plugin/plugin.json` (`1.0.1` →
    `1.1.0`), plus `.gitignore` (new state dir) and `README.md` (docs
    sync) — both directly necessitated by the new marker file, not
    scope creep.
  - **All 10 Acceptance Criteria live-verified, not assumed:** dirty
    tree stops Execute before any mutation; stale base silently
    fast-forwards (`git fetch origin <base>:<base>`, no checkout); a
    genuinely diverged base stops and reports, never forces; a resumed
    session with an existing task branch doesn't create a duplicate;
    an open PR authored by someone else touching overlapping `Scope`
    triggers a real stop (own-PR self-overlap correctly excluded); `gh`
    missing vs. unauthenticated produce distinct messages; the
    `--limit 200` cap on `gh pr list` discloses itself rather than
    silently claiming full coverage; headless hits BLOCKED, never a
    silent proceed; a hand-corrupted marker is rejected (fail-closed).
  - **2 real bugs found and fixed during live verification, not
    hypothetical:** (1) the base-branch-resolution fallback was
    silently using the current checked-out branch as base, which would
    have broken any resumed session already sitting on its own task
    branch; (2) gstack's own `/review` caught an unguarded `JSON.parse`
    on `gh pr list` output that would crash uncaught on malformed
    input.
  - **Wrap-up chain run for real, gstack-pilot's own established
    practice:** `review` (1 fix applied), `qa` (judged inapplicable —
    no web surface on this repo, live-dogfood substituted instead,
    stated explicitly rather than silently skipped), `ship`'s
    applicable parts (its VERSION/CHANGELOG/test-suite machinery
    doesn't match this repo's actual conventions of
    `plugin.json`+README-Releases, so only the parts that fit ran: base-
    currency check, `TODOS.md` cross-reference, merge). Merged via
    PR #1, squash, branch deleted, `main` fast-forwarded,
    `check-init-sync.js` still passes.
  - **3 genuinely-deferred ideas landed in a new `TODOS.md`, not
    silently dropped:** semantic collision detection (shared
    APIs/migrations/contracts, not just path overlap — deferred until
    the shipped path-overlap mechanism gets real usage data),
    local-branch collision detection (same-machine unpushed branches —
    narrower payoff than the PR-scope check), base-branch override
    field on Build Cards (no current project needs a non-default
    integration branch yet).
  - **`v1.1.0` tag/release cut after the fact, 2026-08-31.** `plugin.json`
    was correctly bumped to `1.1.0` in the PR #1 merge commit, but the
    matching `git tag`/`gh release create` step (done for every prior
    version — `v0.1.0`/`v1.0.0`/`v1.0.1`) was missed at the time — human
    caught it (`gh release list` still showed `v1.0.1` as latest).
    Confirmed live via `git tag --list`/`gh release list` before and
    after; tag `v1.1.0` created on the correct commit (plugin.json
    verified at `1.1.0` at HEAD, clean tree, `main` up to date), pushed,
    release notes written matching the established v1.0.0/v1.0.1 voice.
    `gh release list` now shows `v1.1.0` as latest. No code change, no
    new Build Card — a release-metadata gap on already-shipped work.
- **Build Card BC-2026-08-31-gh-setup-loud-nudge shipped, 2026-08-31 —
  one-time loud gh-setup nudge.** Scoped and locked via `/plan-eng-review`
  (2 decisions confirmed with human: placement in both
  `hooks/session-start.js` and `commands/init.md` sharing one sentinel,
  matching the plugin's existing CLAUDE.md-seed duplication precedent;
  and deferring "re-nudge on gh auth regression" to `TODOS.md` rather
  than building it now). Closes the gap the `v1.1.0` design doc
  explicitly flagged and accepted: the per-task `DISCLOSED:` line in
  `pre-flight-sync.js` (untouched by this card) re-prints forever with
  no escalation, so a team that never finishes `gh` setup looked
  identical to one that deliberately doesn't use it.
  - **Files:** `hooks/session-start.js` (new `checkGhSetupOnce()`),
    `commands/init.md` (identical check as a manual-init step, shared
    sentinel `.claude/hooks/state/.gh-setup-checked-gstack-pilot`),
    `TODOS.md` (new "Re-nudge on gh auth regression" entry),
    `.claude-plugin/plugin.json` (`1.1.0` → `1.2.0`), `README.md`
    (Releases entry + comparison-table row). Plus one file added during
    `/review` itself (see below): `VERIFICATION_CHECKLIST.md`.
  - **All 10 Acceptance Criteria live-verified, not assumed.** Real-gh
    session run twice back to back — identical `additionalContext`
    output, no re-nudge (AC1–AC3). Both not-installed/not-authenticated
    message branches produced the exact expected text — verified via an
    in-process mock of `execFileSync` after a Windows-native
    `execFileSync('gh', ...)` PATH-shim approach was tried first and
    abandoned as a test-harness dead end (Windows `CreateProcess`
    doesn't resolve a bare command name against PATHEXT the way a POSIX
    shebang script would, so a fake `gh` script placed earlier on PATH
    was silently skipped in favor of the real, already-authenticated
    system `gh.exe` — a genuine platform quirk, not a code defect) (AC7).
    Sentinel written in every branch tested, including the already-clean
    case (AC3, AC1/AC7 combined). `git diff --stat -- scripts/pre-flight-sync.js`
    confirmed zero diff (AC5). Nothing exited non-zero in any scenario
    (AC6). `init.md`'s wording verified to match `session-start.js`'s
    strings directly, not just visually (AC4, AC7). `TODOS.md` entry
    matches the existing 3 entries' format (AC8). `plugin.json` bumped
    (AC9, first half). `README.md` updated with a Releases entry and a
    comparison-table row (AC10).
  - **One real finding from `/review`, auto-fixed:** `VERIFICATION_CHECKLIST.md`
    (a teammate-facing, 6-item checkable-behaviors doc) hadn't been
    updated for the new nudge — a genuine documentation-staleness gap
    caught by Step 5.6 of gstack's `/review`. Added item 7 (gh setup
    nudges once, never repeats, never blocks) in the same voice as the
    existing 6, committed as a follow-up commit on the same PR before
    merge.
  - **Wrap-up chain actually run:** feature branch
    (`feature/gh-setup-loud-nudge`) → PR #2 → gstack's `/review` (ran
    for real — scope-drift check clean, critical pass clean beyond the
    one auto-fixed doc-staleness finding above) → `qa` judged
    inapplicable (no web/UI surface, same call as BC-2026-08-31,
    substituted with the live-dogfood verification above and disclosed
    explicitly, not silently skipped) → `ship`'s applicable parts only
    (no `VERSION`/`CHANGELOG.md` in this repo, same as BC-2026-08-31 —
    version bump and TODOS.md cross-reference are `plugin.json`'s and
    `ship`'s actual mechanism here) → squash-merged → branch deleted.
  - **`v1.2.0` tag/release cut in the same sitting as the merge this
    time** — the exact gap from `v1.1.0` above, not repeated. Confirmed
    live: `git tag --list` and `gh release list` both show `v1.2.0` as
    latest immediately after.
- **What it is:** the same Advisor/Commander/Execute mode system as
  `role-modes`, with two real behavior differences: Commander's
  planning phase chains into gstack's `office-hours` (new-idea framing)
  → `plan-eng-review` → optionally `autoplan`, before scoping a Build
  Card, instead of Commander authoring the plan itself; Execute's
  wrap-up is **PR-first for every change, no trivial-housekeeping
  exemption** — state-doc update → feature branch → PR → gstack's
  `review` → `qa` → `ship` → merge, always (human's explicit call,
  confirmed via AskUserQuestion — a deliberate divergence from Zenny's
  own Branch/PR Workflow standing rule, which does exempt trivial
  doc-only housekeeping; that exemption is Zenny-specific, not carried
  into this new plugin).
- **Composition mechanism:** file-reference chaining — a command file
  literally says "Follow `<skill>/SKILL.md` — all sections, full
  depth," the same pattern gstack's own `autoplan/sections/*-phase.md`
  use internally. Chosen over cross-plugin Skill-tool invocation, which
  has zero precedent anywhere in gstack's own codebase and risks
  bypassing its mandatory preamble/telemetry/STOP gates.
- **Two new hooks role-modes doesn't have:**
  1. Commander pre-session briefing — `session-start.js` now also
     looks for a `State Doc:` line in the seeded `.claude/CLAUDE.md`
     block and, when mode is `commander`, reads and injects an excerpt
     of that file as ready-made context.
  2. A `SessionEnd` hook — **found and corrected a real design mistake
     before it shipped**, not after: the first draft tried to inject
     `additionalContext` from `SessionEnd`, which has **no
     Claude-visible decision control at all** (verified directly
     against this project's own `session-end.ps1` comment, which
     documents that exact constraint plainly — SessionEnd is fire-and-
     forget, stderr-only, no next turn to inject context into).
     Rewritten to a plain stderr reminder, matching Zenny's own
     `session-end.ps1` pattern.
- **Namespacing, done from day one, not retrofitted:** new sentinel
  (`.claude-md-seeded-gstack-pilot`) and marker
  (`<!-- gstack-pilot-plugin:v1 -->`) — never reuses
  `.claude-md-seeded` bare, which `project-memory` and `role-modes`
  already collided on once before namespacing fixed it. `mode.json`'s
  path IS shared with `role-modes` on purpose (successor design, never
  meant to be co-installed in the same project) — documented as an
  explicit, unverified-if-violated constraint in the new repo's README,
  not silently assumed safe.
- **Seed-block non-duplication design:** the seed block's new "Mode–
  gstack Bridge" section is explicitly scoped to the ordered mode-chain
  sequence only, with text stating it is complementary to (not a
  replacement for) gstack's own separate flat trigger→skill routing-
  table injection (`preamble-routing-injection`) if a project also has
  that — this is a direct, deliberate fix for the exact drift Zenny's
  own root `CLAUDE.md` already has unmerged (its "## Skill routing"
  section, gstack's own onboarding output, self-flagged as pending a
  merge with `using-gstack/SKILL.md` that never happened).

## Fact-check that shaped the chain mapping

Before locking Commander→office-hours/plan-eng-review/autoplan and
Execute→review/qa/ship, ran a live fact-check (not assumed) on whether
gstack itself has a native convention for writing planning-phase
routing into a consuming project's `CLAUDE.md`. **Confirmed it does
not** — every real gstack→CLAUDE.md write found (grepped across all 55
skills) is either the `## Testing`/dev-URL bookkeeping section or
`document-release`'s doc-accuracy sync, neither planning-cadence
content. The one real gstack-native CLAUDE.md convention is the flat,
unordered `preamble-routing-injection` trigger table — already present
verbatim in Zenny's own CLAUDE.md, and explicitly not what the new
plugin's Mode–gstack Bridge section duplicates (see above). The actual
sequencing convention gstack documents lives in its own `docs/
skills.md:119` ("office-hours → plan → implement → review → QA → ship
→ retro"), prose inside gstack's repo, never injected into a consuming
project. The locked chain mapping matches that documented order.

## Live verification done this session (Phase 1, partial)

- **`check-init-sync.js` ported and run for real** — passed first try
  (`OK: commands/init.md's starter block matches the real hook
  output.`), confirming the seed-block v2 content (with the Mode–
  gstack Bridge section + env/tooling field) is byte-identical between
  the hook and the manual-init command.
- **Validation spike (composition mechanism, item a) — done, real,
  scratch dir:** ran gstack's actual `gstack-skill-start` preamble
  script directly (the same Step 0 every gstack `SKILL.md` runs,
  `office-hours/SKILL.md`'s own copy) from a throwaway temp directory.
  Confirmed it is a plain, caller-agnostic shell script — same STATUS-
  line output (`SKILL_START_PROTO: 1`, `SESSION_ID`, instruction
  blocks) regardless of which agent/plugin context invokes it. This
  directly validates the composition-mechanism assumption: a
  `gstack-pilot` command file's "Follow `<skill>/SKILL.md`"
  instruction will trigger the identical real preamble a human-typed
  `/office-hours` would, since the mechanism has no dependency on
  caller identity. **Did not run the skill's actual brainstorming
  workflow** (not the spike's purpose) and deliberately did not act on
  the onboarding/upgrade instruction blocks the preamble returned
  (`upgrade-flow`, `routing-injection`) — this was a throwaway scratch
  directory, not a real project, so acting on them would have been
  noise, not a genuine onboarding decision.
- **Hook-coexistence live test (item b) — NOT run for real, disclosed
  not silently skipped.** Running gstack's actual `./setup --team`
  would mutate the human's real global `~/.claude/settings.json`
  (registers a permanent auto-update SessionStart hook) and
  `~/.gstack/config.yaml` (`team_mode=true`, `auto_upgrade=true`) —
  a lasting, machine-wide side effect outside this plan's disposable-
  scratch-repo intent, and not something to do without asking first.
  Reasoned instead from direct evidence already in hand: Zenny's own
  live `settings.json` today has a plugin-hooks.json-declared
  `SessionStart` hook (`role-modes`'s own) firing correctly *without
  any entry for it in settings.json's own `"hooks"` key at all* —
  proof Claude Code's plugin-hook and settings.json-hook registration
  paths are additive, separate layers, not one overwriting the other.
  This makes hook coexistence very likely safe by construction, but
  it is **not the same as live-proving both hooks' outputs actually
  reach the model in the same session** — that remains open. Deferred
  to Phase 2's real Company Brain run (already the plan's designated
  live-proof point), or done sooner if the human wants `--team`
  actually run now, accepting its global side effect.

## Open items, not blocking, disclosed to the human

- Repo not yet pushed to GitHub (Phase 2).
- Hook-coexistence test above is source-reasoned, not fully live-run.
- Zenny's own unmerged "## Skill routing" vs. `using-gstack/SKILL.md`
  duplication (pre-existing, unrelated to this build, flagged again
  here since the new plugin's design specifically avoids repeating it)
  is still open in Zenny's own `CLAUDE.md` — a future Commander cycle
  item, not touched this session.

See [[reference/gstack-skill-playbook.md]] for gstack's general
Zenny-side decision map, [[reference/role-modes-plugin]] for the
plugin this one is adapted from, and the approved plan file
`C:\Users\muhai\.claude\plans\jazzy-plotting-marshmallow.md` for the
full design record (composition mechanism, chain mapping, staged
rollout).
