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
- **Still open for the rest of Phase 2, genuinely blocked on the human
  now, not a to-do list item:** `/plugin marketplace add` +
  `/plugin install` for both `gstack-pilot` and `project-memory` are
  real interactive Claude Code commands with no tool-equivalent - they
  must run in a session working in `zm-brain` itself. `/gstack-pilot:init`
  and the actual first-Commander-session live-verification (the real
  Definition-of-Done proof point) wait on that.
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
