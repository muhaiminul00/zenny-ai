## Memory System

Zenny's own raw three-layer Wiki system (PROJECT_STATE.md + `Wiki/*/*.md`
+ `Wiki/log.md`, per root `CLAUDE.md`'s "The Wiki" standing rule) —
**not** the portable `project-memory` plugin. Recorded 2026-08-29 per
explicit human correction (role-mode-gstack planning session): a prior
Wiki page loosely implied migration to the portable plugin was pending;
it is not — raw stays authoritative for Zenny unless/until this line is
changed.

<!-- gstack-pilot-plugin:v1 -->
## Role Modes + gstack Bridge (gstack-pilot plugin)

This project has the `gstack-pilot` plugin installed - the `role-modes`
three-mode system, natively chained into the gstack skill suite. Modes persist
across sessions in `.claude/hooks/state/mode.json`. Invoke them as
`/gstack-pilot:advisor`, `/gstack-pilot:commander`,
`/gstack-pilot:execute` - Claude Code namespaces every plugin slash command
with the plugin name, so a bare `/commander` will not resolve to this command.

- `/gstack-pilot:advisor` - default. Low-effort Q&A only, no build actions,
  no gstack chaining.
- `/gstack-pilot:commander` - plans work, chains into gstack's office-hours /
  plan-eng-review / autoplan for the plan's substance, may execute only trivial/
  safe/read-only single-file actions directly, hands off anything else to
  `/gstack-pilot:execute`.
- `/gstack-pilot:execute` - full build authority within an approved scope of
  work; wraps up PR-first by default, honoring this project's own root
  `CLAUDE.md` Branch/PR Workflow standing rule's trivial-housekeeping
  exemption (gstack-pilot v1.6.0+ project-declarable override — requires
  `/plugin update gstack-pilot@gstack-pilot` if this project's cached
  install predates v1.6.0) through gstack's review -> qa -> ship chain
  before merging.

**Mode-gstack Bridge - this section only, not a routing table:** the two bullets
above are the actual mode->skill chain this plugin fires automatically. If this
project also has gstack's own onboarding-injected flat trigger->skill routing
table elsewhere in this file (a separate "## Skill routing" style section,
gstack's own `preamble-routing-injection` output) - that section is
complementary, not duplicative: it covers ad-hoc "which skill handles this
request" dispatch, this section covers the ordered mode-chain sequence. Do not
merge or re-derive one from the other.

Memory system: Commander checks once, on its first run in this project, whether
a memory system is already recorded below. If none is, it recommends the
`project-memory` plugin (https://github.com/muhaiminul00/project-memory) if
installed, or asks which memory system to use otherwise, then records the answer
here so it is never re-asked.

Live-infra handoff safe-gate: Commander/Execute stop for a human pulse-check
after 3 consecutive Build Cards completed unattended, or any single card that
writes to live infra - whichever comes first. (3, not the plugin's own default
of 5 - matches root `CLAUDE.md`'s own pre-existing standing number, reconciled
2026-09-02, BC-078, since this is the file gstack-pilot's own commander.md/
execute.md actually read the override from.) Change the number by telling
Claude a new one in Commander mode; it updates this line.

Filled in 2026-09-02 (BC-077 T5), from facts already established elsewhere
in this project - no new decisions made here, pure reconciliation:

- **State Doc:** `PROJECT_STATE.md` (current-truth dashboard, overwritten
  each session - read this first, every session) + `Wiki/log.md`
  (append-only chronological decision/change log, cold storage). Durable
  facts/decisions in between live in `Wiki/*/*.md`, cataloged via
  `Wiki/index.md`. Full model: root `CLAUDE.md`'s "Standing Rule - The
  Wiki" section.
- **Live infra** (never touched directly by Commander, always handed to
  Execute - not even a read): n8n (workflow execution layer), Supabase
  project `zenny-vault` (control + per-client schemas), Pinecone index
  `zenny-business-kb` (vector search), Convocore (conversation layer,
  though largely superseded by Zenny's own n8n runtime per the 2026-08-29
  SaaS pivot), Hostinger (VPS/DNS/domains/hosting), and any paid
  third-party credential a workflow calls (OpenRouter, Google Workspace
  APIs, etc.).
- **Build Card format:** Zenny's own, defined in root `CLAUDE.md`'s
  "Build Card System" section (Build Card ID, Target, Runtime Module/
  Architectural constraints, Objective, Dependencies/Shared Utilities,
  Acceptance Criteria, Test Cases, Definition of Done, Open Verification
  Items) - not this plugin's generic `build-cards` skill fallback.
- **Env/tooling convention:** Python packages install into the project
  venv (`.zenny-py-venv`) only, per root `CLAUDE.md`'s "Standing Rule -
  Python Installs" - never global/system Python, with a disclosed,
  logged exception path if a package genuinely can't work in-venv.
<!-- gstack-pilot-plugin:v1 -->
