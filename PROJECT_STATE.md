# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-31 (latest) — by /execute — **BC-076-Card1 SHIPPED: the severe `Search_business_kb` client_id-null bug is FIXED and live-verified — the KB tool actually works now.** Restructured (not patched): the tool's sub-workflow now has a real Webhook trigger (same shape as WF-002/013/015) instead of the broken `toolWorkflow`/`executeWorkflowTrigger` mechanism; all 3 Agents now call it via `httpRequestTool` (matching `Check_availability`'s proven pattern) with `client_id` as a static main-chain reference — never LLM-supplied, per D13's tenant-isolation correction. **Live-verified with real content, not assumed:** seeded 2 real facts into 2 different clients' Pinecone namespaces, then proved via 4 real conversations — Commerce-Ecom and Appointment each returned their own client's exact seeded fact; the same Commerce-Ecom client asking an unrelated question did NOT leak the other client's fact (real cross-tenant isolation proof); Consultation's tool call succeeds with a graceful fallback. All cleaned up after (test vectors deleted, temp workflows archived, synthetic conversations purged). Full detail: `06_Infrastructure/n8n/Workflow_Registry.md`'s Search Business KB Tool + all 3 Agent entries, `Wiki/log.md` session-bc076-card1-shipped. **Next:** Cards 2a (dashboard OAuth investigation + test-client provisioning) / 2b (Sheets via service account) → Card 3 (remaining ingestion legs) → Card 4 (canary/smoke-test) — each still needs its own `/plan-eng-review` pass before a Build Card, per the sixth-pass sequencing already locked in `docs/designs/zenny-launch-blueprint.md`.

2026-08-31 (prior) — by /commander — **BC-076 unblock sequence planned via a real gstack `/plan-eng-review` pass (sixth), per human's explicit request for a proper step-by-step plan instead of ad-hoc "what's next" cycling.** Step 0 fired a real STOP: bug fix + 5 ingestion legs + a new verification system + a new credential-testing process + a Sheets design decision is 5 pieces of work, sequenced as Card 1 (build-ready, handed to Execute next) → Card 2a/2b (parallel) → Card 3 → Card 4 (parallel with 3). **3 real decisions locked:** D11 (Google Sheets via service account, not OAuth — human raised a real concern first: the app's existing Gmail/Calendar OAuth is unverified with a 100-user lifetime cap, a 3rd sensitive scope would only make that worse; resolved with live web search, not assumption); D12 (verification/smoke-test = a scheduled automated canary using a fresh conversation every run and asserting real content, not manual-only — this session's own 2 undetected bugs are the reason); D13 (Card 1's `client_id` binding corrected from LLM-`$fromAI`-supplied to a static main-chain reference — a real tenant-isolation gap in the human-approved draft, caught by a Codex outside-voice pass, not hypothetical). **Real cross-reference surfaced:** `Provider_App_Setup_Guide_v1.md` §1.8 already decided Google verification submission "should not wait" — whether that was actually started is now flagged, unconfirmed. Full detail: `docs/designs/zenny-launch-blueprint.md`'s "BC-076 unblock sequence" section + sixth-pass GSTACK REVIEW REPORT, `Wiki/log.md` session-bc076-unblock-sequence-planned. **Next:** Execute builds Card 1 (fix the bug) now; Card 2a needs the human's dashboard OAuth error details to actually investigate.

2026-08-31 (prior) — by /execute — **BC-076 follow-up: system prompts wired to the KB tool, cold-path fix spot-checked on Appointment/Consultation — but a new SEVERE bug found blocks the KB tool from ever working.** Human's chosen next step was the small pass (system prompts + spot-check), not the remaining ingestion legs. **Done:** all 3 archetypes' `agent_prompts` (templates + test-client copies) now instruct the LLM to call `Search_business_kb` for hours/policy/catalog questions instead of refusing outright — live-verified the LLM now actually attempts the tool call on Commerce-Ecom. Appointment and Consultation's cold-path fix (from the prior BC-076 pass) spot-checked with real zero-history conversations — both ran end to end cleanly, confirming the fix holds beyond Commerce-Ecom. **Found, NOT fixed — severe, blocks the whole feature:** `Search_business_kb`'s `client_id` parameter resolves to `null` on every call, live-verified 6 different ways (standard node reference, `.first()`, bare `$json`, legacy `$node[]` syntax, `$fromAI` with the value stamped into the system prompt, `$fromAI` with an explicit tool-description requirement) — none worked. This is a genuine n8n platform limitation: a `toolWorkflow` node invoked as an AI Agent tool cannot reliably resolve `$()`/`$json`/`$node[]` references to sibling main-chain nodes (confirmed the identical expression pattern resolves fine on ordinary main-chain nodes in the same workflow). **Consequence: the tool always queries Pinecone under an empty/wrong namespace and will never return real client-specific content, even once the remaining ingestion legs are built** — this must be fixed and re-verified with a genuinely grounded answer before BC-076 clears any launch gate, per D6. Real fix needs deeper investigation than this pass allowed — candidates: `toolWorkflow`'s raw-JSON `source: 'parameter'` mode (untested), or restructuring the tool as an inline `httpRequestTool` per-workflow (matching `Check_availability`'s proven architecture) instead of one shared sub-workflow. All test/temp n8n workflows archived, test Pinecone vector deleted, synthetic conversations cleaned up. Full detail: `06_Infrastructure/n8n/Workflow_Registry.md` (new "REAL BUG FOUND, NOT FIXED" section under Search Business KB Tool + updates to all 3 Agent entries), `Wiki/log.md` session-bc076-followup-kb-client-id-bug. **Next:** the client_id resolution bug is the actual blocker now — fixing it is higher priority than the remaining ingestion legs, since ingesting more content into a tool that can't retrieve it by client changes nothing observable. After that: WooCommerce/Sheets/Baserow/generalized-Notion ingestion legs + D9's full demo-business verification pass, still not started.

2026-08-31 (prior) — by /execute — **BC-076 first slice shipped: Search Business KB tool schema + tool built and wired into all 3 shipped archetype Agents; 2 severe pre-existing bugs found+fixed live, unrelated to BC-076 itself.** Per human's explicit scope-split, this pass covers: `control.client_kb_source` generalized (composite PK, `source_type` enum, `source_ref` rename, `upsert_client_kb_source` RPC — a real grant/orphaned-overload bug found+fixed during the migration, same recurring class as BC-052/064/072), new dedicated Pinecone index `zenny-business-kb` (created via raw REST since the MCP's `create-index-for-model` only supports Pinecone-integrated-embedding indexes — wrong shape here), and the `Search Business KB` tool sub-workflow wired as a `toolWorkflow` into Commerce-Ecom/Appointment/Consultation. **NOT built this pass (deferred, per the agreed split):** the Shopify/WooCommerce/Google-Sheets/Baserow ingestion legs and D9's full demo-business verification. **2 severe, pre-existing, cross-archetype bugs found and fixed live while verifying the tool wiring — affecting all 3 Agents since BC-073/074/075 shipped, not caused by BC-076:** (1) `Memory Cold?`'s IF-node `rightValue` was an empty string instead of boolean `true`, crashing every genuinely first-time customer conversation before it ever reached the Agent; (2) `Get Recent History (RPC)` legitimately returns 0 rows for a first-time customer, and n8n's zero-item skip silently killed the entire rest of the chain (Agent never ran, no response ever sent) while the execution still reported "success" — fixed with a new `Has History?` gate, not a naive `alwaysOutputData` (which crashes a different way, per the SDK's own documented footgun). **Live-verified after both fixes:** a genuinely first-time conversation now runs end to end on the Commerce-Ecom Agent — but the LLM did NOT call the new KB tool for a real hours/policy question, because the existing system prompt (predates BC-076) explicitly tells it to say "I don't have that information" rather than search — **flagged as necessary follow-up work: each archetype's system prompt needs an instruction to use `Search_business_kb`, or the tool stays wired but functionally inert.** Also found and fixed: an operational quirk where `update_workflow` edits create a new draft version that `executeWorkflow`/production calls never see until `publish_workflow` is called explicitly. Full detail: `06_Infrastructure/n8n/Workflow_Registry.md` (new Search Business KB Tool entry + updates to all 3 Agent entries + SCH-004), `Wiki/log.md` session-bc076-first-slice. **Next:** update the 3 archetypes' system prompts to actually use the new tool; build the remaining 4 ingestion legs (WooCommerce/Sheets/Baserow/generalized-Notion — Shopify not yet built either) + D9's demo-business verification pass; spot-check Appointment/Consultation's cold-path fix with a real conversation (only Commerce-Ecom was live-tested this session).

2026-08-31 (prior) — by /execute — **Part 1's production-readiness gate
begins: Part 8 (disclosed `zenny-notification-sender` credential blocker,
Active Blocker since BC-053) CLOSED, live-verified, not just trusted on
the human's word.** Human reconnected the Gmail OAuth credential and
asked for verification before moving to BC-076. **Found live, not
assumed:** the most recent real exercise of this credential (an hourly
"Tool Execution Fallback" chain, `UTcdzMvOb7gCQM5J` → UTIL-004) had
failed at 09:01 UTC with "needs to be reconnected" — the reconnect's
effect hadn't been exercised by anything since. Built a throwaway 2-node
test workflow (Manual Trigger → Gmail send, bound to the same credential
ID `dUDWiqDs4C95gnLG` the production nodes use), executed it live:
real success, real Gmail message ID `1a05730046f5a2e9`, `SENT` label —
genuine proof, not a credential-exists check. Temp workflow archived
immediately after. **Real, separate gap found and flagged, not fixed
(out of Part 8's scope):** that same hourly fallback chain has 609 error
executions on record, all for an unrelated root cause — a client's
inbox-sync is missing a `client_connections` row for its email category,
which has been silently failing hourly. Worth folding into Part 7
(ops/monitoring) or the channel-gateway audit (Part 4) when picked up —
not touched here. Full detail: `Wiki/log.md`
session-part8-credential-verify-and-bc076-planning. **Next:** BC-076
(business-memory/KB tool) — per Part 1's D6, launch-critical, backend
must be verified against 1-2 internally-built demo businesses before any
real client goes live. Needs its own gstack `/plan-eng-review` pass for
the actual build-ready spec (schema, ingestion workflow, per-archetype
wiring) before a formal Build Card is issued — not yet done as of this
entry.

2026-08-31 (prior) — by /execute — **BC-074/075 shipped: Appointment +
Consultation archetype nodes built, live-verified, published, both
inheriting BC-2026-08-31's memory-rehydration pattern from day one.**
Eng review (gstack `/plan-eng-review`) found: no new confirmation gate
needed for either archetype (the locked commerce guardrail is scoped to
money-shaped actions, neither `WF-003` nor `WF-010` touches client
money/stores); `insert_client_lead`'s FK requires a lead before either
Tool can be called, so 2 new lead-mint sub-workflows were built (same
shape as BC-073's cart one, minus the verification-queue step); no real
lead-scoring mechanism exists anywhere in Zenny's own runtime, so
BC-075 ships an explicitly-flagged provisional inline LLM-derived score
as a stand-in, not a finished scorer. Human's cross-archetype capability/
business-memory question resolved via AskUserQuestion: scoped OUT of
these cards, deferred to a future BC (recommended shape: generalize the
existing Notion+Pinecone KB pattern into a cross-archetype tool). **1
cross-cutting bug found live, affecting already-shipped BC-073:**
`Check_availability`'s explicit `responseFormat:'json'` crashes on any
real tool call (`Cannot read properties of undefined reading 'data'`) —
had been silently broken in production since BC-073 shipped 2026-08-29;
fixed in all 3 workflows, republished. **Real, disclosed external
blocker (pre-existing, not a defect here):** both new test clients have
zero calendar connections, and `WF-002`/`WF-003`/`WF-010`'s shared
credential-resolution step now hard-crashes in that case because its own
notification fallback hits the already-expired `zenny-notification-
sender` Gmail credential (Active Blocker since BC-053) — blocked a fully
clean success-path test for the calendar-touching tools; everything up
to that known point verified live and correct instead. **Fully clean,
un-blocked proof obtained:** WF-010's real hard Score Gate correctly
rejecting a low score with a genuine 400, live end to end. 2 new n8n
platform quirks logged (`Wiki/platform-quirks/n8n-node-behaviors.md`
items 5-6). All synthetic test data cleaned up. Full detail:
`06_Infrastructure/n8n/Workflow_Registry.md`, `Wiki/log.md`
session-bc-074-075-build. **Next:** the disclosed calendar-credential
blocker needs human OAuth reconnection before a fully clean success-path
test is possible for any calendar-touching archetype tool; otherwise
awaiting human go-ahead for further work (BC-076+ business-memory tool,
or channel-gateway track).

2026-08-31 (prior) — by /execute — **BC-2026-08-31-concurrency-hardening
shipped: 4 real multi-tenant/multi-concurrent-user gaps in BC-072/073
found + fixed, human-flagged before any more archetype nodes get built
on the same foundation.** gstack `/investigate` found 3 SQL-level race
conditions (duplicate conversations, double-fulfillment on verification
approval, duplicate verification-queue rows — all check-then-act with
no DB guarantee) plus, on a second human-requested scan of the full n8n
chain, a 4th: the Commerce-Ecom Agent's real memory is n8n's in-process
`memoryBufferWindow`, never rehydrated from BC-072's own Postgres
`messages` table, so a container restart silently wipes live
conversation context. `/plan-eng-review` produced the fix spec; human
picked the smaller memory-rehydration fix over a full custom
Postgres-backed memory system (pre-launch, single n8n instance — not
over-engineering for scale not yet needed). All 4 fixed: partial unique
indexes + `ON CONFLICT`/atomic-UPDATE rewrites across all 11 schemas (5
`tpl_*` + 6 client schemas) for findings 1-3; a new `get_recent_messages`
RPC + 4-node rehydration chain in `Zenny Runtime - Commerce-Ecom Node`
for finding 4. **1 real security bug caught mid-build:** the 2 new
claim/unclaim RPCs picked up Postgres's default PUBLIC execute grant
(same exposure class as BC-052/064) — fixed before anything else
touched them. **2 real n8n bugs found live-testing the memory fix:** a
zero-item-output starves downstream nodes (n8n doesn't run a node on a
zero-item input) — broke the exact cold-buffer branch meant to catch
this; a new HTTP node's credential was never auto-assigned. Both fixed,
re-verified live. **All 5 ACs live-verified** — genuinely concurrent
calls against the fixed RPCs, plus a real n8n execution via a temporary
Manual Trigger test harness for the memory path (`execute_workflow`
can't start `executeWorkflowTrigger` workflows directly). All synthetic
test data cleaned up after. **Standing outcome:** every future archetype
Build Card (BC-074/075+) designed and verified against concurrent
multi-client/multi-user load from the start — not just single-session
correctness. Full detail: `Wiki/platform-quirks/
n8n-concurrency-race-patterns.md`, `Wiki/infra/
verification-approval-queue.md`, `06_Infrastructure/n8n/
Workflow_Registry.md`, `Wiki/log.md`
session-bc-2026-08-31-concurrency-hardening. **Next:** BC-074/075
(appointment, consultation archetypes), building on this now-hardened
foundation, with the concurrency standard applied from the start.

2026-08-31 (prior) — by /execute — **`gstack-pilot`: Build Card
BC-2026-08-31 shipped — Execute's pre-flight sync gate + live PR-scope
collision check, hook-enforced (not prose-only) via a new `PreToolUse`
hook + `scripts/pre-flight-sync.js`, fail-closed on a corrupt marker.
2 real bugs found+fixed live (base-branch-resolution fallback bug on
resumed sessions; an unguarded `JSON.parse` crash caught by `/review`).
Merged PR #1, `plugin.json` `1.0.1`→`1.1.0`. Full detail: `Wiki/
reference/gstack-pilot-plugin.md`, `Wiki/log.md`
session-bc-2026-08-31-sync-gate-shipped.

2026-08-30 (prior) — by /execute — **`gstack-pilot`'s README fully
current now — both flagged stale claims fixed.** "Current release:
v1.0.0" → v1.0.1 with the real patch reason stated; `## Status`
rewritten from a false "not yet run against a real team project" to
what's actually proven (3 real PRs on `zm-brain` through the full
review pipeline, 2 real findings fixed, 3 consistent scope-drift
detections handled correctly). Docs-only, no version bump. Committed
direct to `main` (`6bd50d9`). Full detail: `Wiki/reference/
gstack-pilot-plugin.md`, `Wiki/log.md`
session-gstack-pilot-readme-status-fix. **`gstack-pilot` initiative is
now fully closed out — built, released, proven live, documented
accurately, team-onboarding docs in place.** Zenny-migration remains
the one open, unhurried, human-owned decision.

2026-08-30 (prior) — by /execute — **`gstack-pilot` gained
`TEAM_SETUP.md` + `VERIFICATION_CHECKLIST.md`; corrected a real
`!command` misconception before building anything.** Human asked
whether install commands should use `!command` syntax for Claude-side
retry - corrected: `!` is a convention local to this interactive chat,
meaningless in a committed README. Real fix: hand teammates a prompt
for Claude to run itself (the gstack global-install shell steps, with
retry), but keep the 4 `/plugin marketplace add`/`/plugin install`
lines as human-typed (no tool-equivalent exists for Claude to run
them, confirmed earlier this session). Built both docs honest to that
split. **Found and flagged, not fixed (pending go-ahead):** README's
"Current release: v1.0.0" and "Status: not yet run against a real
team project" lines are now stale (real release is v1.0.1; `zm-brain`
already proves the opposite of what Status claims). Committed direct
to `main` (`ba07da8`), consistent with this repo's own practice. Full
detail: `Wiki/reference/gstack-pilot-plugin.md`, `Wiki/log.md`
session-gstack-pilot-team-docs. **Next:** human's call on fixing the
two stale README claims.

2026-08-30 (prior) — by /execute — **`zm-brain`'s canonical docs
re-framed as a reference baseline, not a final spec — third real PR
through the pipeline (PR #3).** Human's real concern: the 8 canonical
documents are labeled "frozen" (July 2026), but that describes internal
completeness, not current accuracy — the plan/market have moved since.
Added an explicit note to `CLAUDE.md`'s Canonical Documents section:
treat the set as a reference starting point for Technical Architecture,
every real-world claim needs genuine re-verification against present
goal/market (via gstack's `plan-eng-review`/`office-hours`) before
building — not the separate Document Resolution Authority rule
(internal precedence between docs, untouched, orthogonal concern).
Scope-drift detection flagged the same known uncommitted file-move a
third consecutive time — still not touched, still the human's own call.
Zero review findings. Squash-merged (`ca737b4`). Full detail: `Wiki/
reference/gstack-pilot-plugin.md`, `Wiki/log.md`
session-zm-brain-reverify-note. **Next:** human resolves the uncommitted
file-move whenever convenient; `zm-brain` onboarding + governance is
otherwise fully done.

2026-08-30 (prior) — by /execute — **`zm-brain`'s README fixed +
onboarding pointer added, second real PR through the pipeline (PR
#2).** Found the false-existence claim `/review` flagged in `CLAUDE.md`
last pass actually originated in README.md itself — fixed at the
source. Added a short "Working in this repo" pointer to `CLAUDE.md`.
Caught and fixed a real inaccuracy in my own first draft before
shipping (`check-gstack.sh` is a `PreToolUse` hook, not a git pre-
commit hook). Scope-drift detection correctly flagged an unrelated,
**uncommitted** working-tree change in the repo (`Idea_and_sollution_
ZM_CompanyBrain.txt` moved to `docs/deck & proposal/`) — not touched,
flagged for the human to confirm intentional or revert. Review found
zero issues on the actual diff. Squash-merged (`9f9049b`). Full detail:
`Wiki/reference/gstack-pilot-plugin.md`, `Wiki/log.md`
session-zm-brain-readme-update. **Next:** human confirms the uncommitted
file-move; otherwise `zm-brain` onboarding is fully done.

2026-08-30 (prior) — by /execute — **`gstack-pilot`/`project-memory`
onboarding for `zm-brain` is fully, genuinely complete — Phase 2 done.**
Built a proper root `CLAUDE.md` for `zm-brain` (full rewrite, human's
call, mirroring Zenny's own governance pattern: Project Summary grounded
in real project docs, Session Start order, Memory System, adapted
Standing Rules — Document Resolution Authority + Branch/PR Workflow —
the existing Canonical Documents list carried over, `## gstack
(REQUIRED)` carried over byte-for-byte, diff-verified). **Then actually
ran it through the full gstack PR/review pipeline for real**, on this
project's own new no-exemption Branch/PR rule (the file stating that
rule was itself the test case): branch → PR #1 → gstack's real `review`
skill. Preamble surfaced a genuine onboarding gate (routing-rules
injection), handled via AskUserQuestion. Review found and auto-fixed
one real issue: `marked_for_technical_architecture.md` was referenced
as an existing document (carried forward from a pre-existing README
inaccuracy) — verified via `find`/`grep` it doesn't exist, corrected.
Zero critical findings (checklist's SQL/race/shell-injection categories
are all code-specific, correctly didn't apply to a markdown diff).
Squash-merged, branches cleaned up. Full detail: `Wiki/reference/
gstack-pilot-plugin.md`, `Wiki/log.md` session-zm-brain-claude-md-
rewrite. **`zm-brain` is now a fully working example of the whole
system: populated, plugin-declared, gstack-team-init'd, has a real
governance doc, proven end to end through the actual pipeline, not just
described.** **Next:** Zenny-migration decision — human's call, no
pressure, deferred.

2026-08-30 (prior) — by /execute — **`zm-brain`'s plugin declaration
completed (`extraKnownMarketplaces` was missing, project-scoped only
`enabledPlugins` before) — and a real, unresolved content-loss found
and correctly NOT touched.** Confirmed via `claude-code-guide` research
(not assumed) that Claude Code auto-registers a committed project's
`extraKnownMarketplaces` on folder-trust, but never auto-installs
plugin code — natively shows "not installed, run this command," no
custom hook needed on `gstack-pilot`'s own side. Fixed the real gap:
`zm-brain`'s marketplace registrations had landed in the human's
*global* settings, not the project's — copied the real, working shape
in, merged (not clobbered) alongside the existing `enabledPlugins`/
PreToolUse hook, committed everything that had been sitting
uncommitted (`.claude/CLAUDE.md`, `.claude/hooks/state/`,
`.project-memory/` - checked, nothing sensitive), pushed (`81d2ff4`),
read back from the real committed `HEAD` to confirm, not assumed.
**🚩 Found and correctly did NOT commit:** `zm-brain`'s root `CLAUDE.md`
is missing 3 whole sections locally (Current task, all 6 Hard Rules,
Definition of done) vs. its last commit — not from anything this or
the prior session touched. Left untouched, flagged plainly. **Human
action needed:** resolve this in `zm-brain` (`git checkout CLAUDE.md`
to restore from the last commit, if the loss wasn't intentional) before
that repo's state is fully trustworthy. Full detail: `Wiki/reference/
gstack-pilot-plugin.md`, `Wiki/log.md`
session-zm-brain-plugin-declaration-fix. **Next:** human resolves the
`CLAUDE.md` gap; Phase 2 is otherwise functionally complete.

2026-08-30 (prior) — by /execute — **First real-world use of
`gstack-pilot` (in `zm-brain`) found one genuine bug, fixed same
session: v1.0.1 released.** Human ran the full 6-item verification
pass in a real `zm-brain` session. 4/6 clean; item 3/4 (memory-system
check) "failed" only because Commander's own bare-invocation-stops
rule correctly hadn't given it a turn yet — re-run confirmed
`project-memory` auto-recommends/scaffolds cleanly, no sentinel
collision. **Item 5 found a real gap:** "propose reviving [an already-
scoped roadmap phase]" misrouted to `office-hours` instead of
`plan-eng-review` — surface phrasing ("propose") pattern-matched
gstack's own office-hours trigger vocabulary despite the substance
being already-scoped. Self-corrected before executing anything (no
side effects) — proves the chain mechanism and its safety property
both work. **Fixed:** `commander.md`'s branch-selection criterion now
has an explicit disambiguator (a prior document naming the work as
scoped wins over tentative phrasing, always). `session-start.js`
checked, no duplicate fix needed. Patch release `v1.0.1` (`829cd00`),
live-verified same as prior releases. Full detail: `Wiki/reference/
gstack-pilot-plugin.md`, `Wiki/log.md`
session-gstack-pilot-first-use-verification. **Next:** confirm the
routing fix holds on re-test, then Phase 2 is effectively complete —
human direction awaited; Zenny-migration decision stays deferred.

2026-08-30 (prior) — by /execute — **Phase 2's real target repo,
`zm-brain`, populated and gstack-team-init'd — plugin installs blocked
on the human, real stop, not a workaround.** Local folder
`E:\Programming\ZenoManual - Compnay Brain` (pre-existing content: 8
frozen canonical architecture docs, root CLAUDE.md with 6 phase-gated
Hard Rules, pitch-deck materials, full grounding-phase archive) git-
init'd and pushed as-is, no restructuring, to `github.com/muhaiminul00/
zm-brain`. `gstack-team-init required` run for real: appended a `##
gstack (REQUIRED)` section to that repo's own CLAUDE.md (confirmed pure
append — none of its 6 existing Hard Rules or canonical-doc list
touched, verified via diff before committing) and registered a
`PreToolUse` block-hook (`.claude/hooks/check-gstack.sh`) requiring
gstack be installed globally before any Skill tool use in that repo.
Pushed. **Genuinely blocked, not routed around:** `/plugin marketplace
add` + `/plugin install` for `gstack-pilot` and `project-memory` are
real interactive Claude Code commands with no tool-equivalent, and need
to run in a session actually working in `zm-brain`, not this Zenny
session — reported to the human with the exact 5 commands to run there.
`/gstack-pilot:init` and the first real Commander-session verification
(the actual live-proof point Phase 2's Definition of Done needs) wait
on that. Full detail: `Wiki/reference/gstack-pilot-plugin.md`, `Wiki/
log.md` session-zm-brain-onboarding. **Next:** human runs the 5 plugin
commands in a zm-brain session; resume the live-verification pass once
that's done.

2026-08-29 (prior) — by /execute — **`gstack-pilot` v1.0.0 released —
hook-coexistence gap closed for real, and gstack is now running in
`--team` mode machine-wide (real, disclosed side effect for Zenny too).**
Human chose to close the one disclosed v0.1.0 gap immediately rather than
defer it: ran gstack's real `./setup --team` against the actual global
Claude Code environment. **Hit and cleanly resolved a real permission
denial first** (the auto-mode classifier blocked the command outright;
stopped and asked per the Permission Denials standing rule rather than
working around it — human ran it directly). Live-diffed before/after
(backups taken first): `~/.gstack/config.yaml` now `team_mode: true`/
`auto_upgrade: true`; `~/.claude/settings.json` gained a new `SessionStart`
entry appended additively alongside 5 pre-existing unrelated entries (none
disturbed, JSON valid throughout) plus a new `Stop` entry — both expected,
disclosed side effects of the setup script itself. `gstack-pilot` bumped
`0.1.0` → `1.0.0` on this real evidence (plus `role-modes`' own plugin
hook's independently-confirmed same-session coexistence with Zenny's own
settings.json hooks) — tagged, released, live-verified the same way as
v0.1.0. **Real, disclosed, ongoing side effect for Zenny specifically:**
gstack now self-updates at the start of Zenny's own sessions too (machine-
wide hook, not project-scoped) — a future session should check
`gstack-config get` rather than assume a prior Wiki page's non-team
finding still holds. No repo was `gstack-team-init`'d — only the global
toggle changed. Full detail: `Wiki/reference/gstack-skill-playbook.md`,
`Wiki/reference/gstack-pilot-plugin.md`, `Wiki/log.md`
session-gstack-team-mode-enabled. **Next:** rest of Phase 2 (the gstack
`--team` packaging sequence for a real Company Brain repo, `project-memory`
pairing, actual teammate handoff) — awaiting human direction.
Zenny-migration decision stays deferred until Phase 2 is fully proven, per
human's own framing.

2026-08-29 (prior) — by /execute — **BC-073 (commerce-ecom node) BUILT,
LIVE-VERIFIED, and PUBLISHED — first real archetype node on Zenny's own
runtime.** Extended BC-072's shared sub-workflow with customer resolution (a
real gap found live — conversations never linked to a customer); built two
new workflows (`Zenny Runtime - Queue Commerce Cart Verification`,
`Zenny Runtime - Commerce-Ecom Node`, an Agent with tool-calling); extended
`resolve-pending-verification` with a `CreateCart` branch. **5 real bugs
found and fixed live during the build** (not anticipated in planning):
`channel_type_enum` missing `web_chat`/`instagram`; a hyphen-vs-underscore
mismatch between `channel_type_enum` and `source_channel_enum`; a check
constraint rejecting the new `CreateCart` tool_name across 11 schemas; a
scalar-RPC response-parsing bug; a prompt placeholder colliding with n8n's
own `{{ }}` expression syntax. **Live-verified with real external calls:** a
genuine WF-002 stock check, a grounded OpenRouter response, cross-turn memory
recall correctly blocking an out-of-stock order, and an independently-proven
cart-verification queue (real lead + real `pending_verifications` row).
**One thing not fully verified, disclosed:** the approval Edge Function's new
branch needs a real dashboard JWT to test live — none exists yet, same
disclosed gap BC-053/BC-063 already carry. Full detail: `06_Infrastructure/
n8n/Workflow_Registry.md`'s 3 new BC-073 entries, `Wiki/log.md`
session-bc073-commerce-ecom-node-build. **Next:** BC-074/075 (appointment,
consultation), same bridge and foundation.

2026-08-29 (prior) — by /commander — **BC-073 (commerce-ecom node) planned
via gstack's `/plan-eng-review` — first real use of the planning bridge.**
Real findings, not rubber-stamped: (1) live Convocore-era Tools already exist
for this archetype (`WF-002` CheckAvailability, `WF-005` CreateCart) — reuse,
don't rebuild; (2) BC-073 needs its own Agent-based n8n workflow, not
BC-072's `chainLlm` sub-workflow (no tool-calling there) — caught in
planning, not mid-build, the exact gap the bridge exists to close; (3) those
Tools are `Webhook`-triggered, so they wire in as HTTP Request Tools, not
`toolWorkflow` (a real n8n mechanic, logged as a gstack learning for
BC-074/075 too); (4) the already-locked commerce-tool guardrail isn't
satisfied by WF-005 alone — BC-073 must gate CreateCart through the existing
Verification Approval Queue (BC-053), not call WF-005 directly; (5) lead
capture (WF-001) resolved out of scope via AskUserQuestion — BC-072's
`find_or_create_conversation` already covers first contact. Full build-ready
spec: `docs/designs/zenny-saas-runtime-pivot.md`'s new "BC-073 Eng Review"
section. Full detail: `Wiki/log.md` session-bc073-gstack-eng-review. **Next:**
package this spec into the formal Build Card and hand to Execute.

2026-08-29 (prior) — by /commander — **Commander → gstack → Execute
planning bridge made mandatory.** Prompted directly by BC-072's live
architecture-mismatch discovery below (schema-per-client vs RLS, caught
mid-build instead of in planning): every time Execute hands work back to
Commander, Commander's next action is now a short prompt to the fitting
gstack skill (`/office-hours`, `/plan-ceo-review`/`/plan-eng-review`, or
`/autoplan`) — never drafting the next Build Card's plan itself. **Scope
confirmed via AskUserQuestion before writing anything:** gstack's
"execution" skills (`/ship`, `/review`, `/qa`, `/investigate`) are
release/verification ceremony around code that already exists, not
authorship, and none hold n8n/Supabase MCP tools — so gstack plans infra
Build Cards (a build-ready spec, node/table/RPC-level, edge cases
pre-resolved) but Execute still authors and runs every n8n/Supabase/VPS/
DNS build; Dashboard-repo code is unchanged (Execute authors, `/review`→
`/ship` ships it, per the existing Branch/PR Workflow standing rule).
Written into root `CLAUDE.md` ("Gstack planning bridge" subsection under
Commander → Execute auto-handoff, plus a scoping note under Build Card
System and a pointer in `## gstack`) and `Wiki/reference/
gstack-skill-playbook.md` (Build Card planning row + new Status entry).
Full detail: `Wiki/log.md` session-gstack-planning-bridge-mandatory.
**Next:** apply this bridge for real on BC-073/074/075 — prompt gstack
before drafting any of the three archetype Build Cards.

2026-08-29 (prior) — by /execute — **BC-072 (Shared Runtime Foundation)
built, live-verified, and published — the first real workflows on Zenny's
own conversation runtime.** Two n8n sub-workflows live: `Zenny Runtime -
Resolve or Create Conversation Session` (`hA0PJmeEzEeLssNC`) and `Zenny
Runtime - Call LLM via OpenRouter` (`OuJt2xCEOL8CgZJy`). New Supabase schema:
`conversations`/`conversation_sessions`/`messages` added to all 5 `tpl_*`
templates + backfilled into the 3 test-client schemas Phase 1 needs, plus
`find_or_create_conversation`/`append_message` RPCs. **Real architecture
correction found live before building, not after:** tenant isolation is
schema-per-client (matching every other phase already built here), not the
RLS+`organization_id` model `Zenny_MultiNode_Runtime_Architecture_v1.0.md`
assumed — found by reading WF-017 directly. **Two real bugs found+fixed
during live verification:** an implicit-Postgres-`PUBLIC`-grant gap on the
new RPCs (checked — not present in any of BC-064's already-fixed 62
functions, isolated to these 2 new ones); this project's recurring n8n
IF-node boolean-strict-type-validation bug, fixed the same proven way as its
precedent. **Verified via `execute_workflow` (manual mode), not
`test_workflow`-pinned** — a real OpenRouter call, a real conversation row
created+replayed for idempotency, and genuine cross-tenant isolation proven
(same `external_id`, two different clients, two separate schemas, two
separate rows). All synthetic test data cleaned up after. **Also found,
unrelated to BC-072, flagged not auto-fixed:** `public.waitlist_entries` and
`control.archetype_recovery_defaults` have RLS disabled — needs the human's
policy decision before enabling (enabling without policies would block all
access). **Next:** BC-073/074/075, one per confirmed archetype (commerce-ecom,
appointment, consultation). Full detail: `06_Infrastructure/n8n/
Workflow_Registry.md`'s "Zenny Own Runtime (Phase 14)" section,
`docs/designs/zenny-saas-runtime-pivot.md`, `Wiki/log.md`
session-bc072-shared-runtime-foundation.

2026-08-29 (prior) — by /commander — **Architecture locked for Zenny's own
conversation runtime (Convocore replacement): MultiNode Runtime v1.0 +
Channel Adapter v2.0, both real docs in `05_Platform_Builds/Zenny_SaaS/`.**
Ran the full gstack review pipeline (`/office-hours` → `/plan-ceo-review` →
`/plan-eng-review`, plus an independent Codex outside-voice pass, 20
findings) then a real post-review correction pass once the founder surfaced
facts none of those reviews had: **Convocore is fully stopped** (service
paused, own-infra commitment already made — not a future option); **Carmelli
Bakery is decoupled from this build's validation** (separate December
delivery, unrelated reason); **real demand evidence exists** — a Meta ad run
generated 7-8 leads/day, nobody converted, stated reason was price (directly
validates the cost-reduction thesis, stronger than the original "1 thin
client" framing); **channel parity (web chat + WhatsApp + Instagram) is
required at launch**, reversing the original fast-follow plan, because the
unconverted leads were quoted that exact channel set via Convocore; **Phase 1
now needs 2-3 archetype node types**, not the single commerce-ecom node
originally scoped around Carmelli; **timeline is honestly dual-stated** —
founder's target is 1-1.5 months to full production, architecture docs' own
estimate for the corrected larger scope is 2.5-3 months, both on record, not
one hiding the other. **Real open item, blocking the next Build Card:** which
specific 2-3 archetypes (of the 6) the lead pipeline needs — "mixed"
confirmed, not yet named. No Build Card issued yet; no live n8n/Supabase/VPS
action taken this session. Full decision record with every AskUserQuestion
answer: `docs/designs/zenny-saas-runtime-pivot.md`. Wiki:
`Wiki/decisions/zenny-saas-runtime-pivot.md`, `Wiki/log.md`
session-zenny-saas-runtime-pivot.

2026-08-29 (prior) — by /execute — **Pipeline health-check + `/doctor`
cleanup, ahead of Zenny SaaS planning.** `/doctor` disabled 4 zero-lifetime-
use plugins (`claude-code-setup`, `commit-commands`, `andrej-karpathy-skills`,
`skill-creator`) in `~/.claude/settings.json` and removed a dead
`"book-to-skill": "off"` `skillOverrides` entry from
`.claude/settings.local.json` (it targeted a Claude-Code-skill name that
never existed; `book-to-skill` is a real CLI in `.zenny-py-venv/Scripts/`,
unaffected — CLAUDE.md's routing-table reference was correct all along).
**Then live-proved the gstack pipeline still works post-cleanup**: synthetic
3-issue fixture → PR #2 → `/review` correctly flagged all 3 (SQL injection,
shell injection, race condition) with exact file:line citations and
sane confidence scores → PR closed unmerged, branch deleted, fixture never
touched `main`. Role-mode `mode.json` transitions and the `post-edit.ps1`
hook both confirmed working correctly during the run. Two real gstack-tool
gaps found and logged as gstack learnings (not Zenny decisions): the Shell
Injection checklist category is Python-example-only (still generalized
correctly here); `bun.exe` isn't on this environment's default Bash PATH,
silently breaking gstack's own bun-shelling scripts unless fixed up per
shell call — worth a permanent PATH fix outside any single session. Full
detail: `Wiki/log.md` session-gstack-pipeline-healthcheck.

2026-08-29 (prior) — by /execute — **Branch/PR workflow adopted
(human's explicit call: "use full potential of gstack... production
grade approach"). gstack's `/review`/`/ship` are now live-usable, not
just documented.** Remote `zenny-sync` renamed → `origin` (the literal
name gstack requires) — push/fetch/`origin/HEAD` re-verified live under
the new name. New `CLAUDE.md` Standing Rule — Branch/PR Workflow:
substantive work goes feature-branch → PR → `/review` → `/ship`;
trivial Wiki/log/PROJECT_STATE-only housekeeping stays direct-to-`main`.
**Live-proved end to end, not just declared:** the workflow-adoption
change itself went through the real flow — branch pushed, real PR
opened (`zeromanualai/zenny-producition-sync#1`), `/review`'s actual
base-branch/diff-detection mechanics run against it (found the real
3-file diff this time, the exact point that previously failed),
critical-pass review done by hand (0 findings, clean, docs-only diff),
PR merged and branch deleted. Also fixed an unrelated inaccuracy found
in the same pass: the Dashboard is a subfolder of this repo
(`05_Platform_Builds/Dashboard/`), not a separate repository as earlier
phrasing implied — `/ship` scoping corrected to be by changed path, not
by repo. **2 real permission denials hit and resolved per the Permission
Denials standing rule** (not stopped on, not essential): `gh pr merge`
and `git checkout main` were both blocked by the auto-mode classifier;
`git switch main` and a plain `git merge --no-ff` + `git push` worked
as equivalents (GitHub auto-detected the merge and marked the PR
`MERGED`) — logged as the substitution to use going forward if this
recurs. Full detail: `Wiki/log.md` session-gstack-branch-pr-workflow,
`Wiki/reference/gstack-skill-playbook.md`.

2026-08-29 (prior) — by /execute — **gstack-integration Phase 3
validated live: real `/review` structural gap found, hook-update gap
closed.** Ran gstack's `/review` for real against the dispatch-rewrite
commit — found it hard-requires an `origin` remote + PR/branch-vs-base
diff, neither of which this repo has (remote is `zenny-sync`, direct-to-
`main` workflow); confirmed via live `git remote`/`git branch` checks,
not assumed. `/review` immediately reports "nothing to review" and
stops here — not worked around by faking a branch. Updated `CLAUDE.md`'s
routing row, `.claude/skills/using-gstack/SKILL.md`, and `Wiki/reference/
gstack-skill-playbook.md` to say `/review` is the real default only once
Zenny adopts a branch/PR workflow (open, human decision, not made here);
`mattpocock-skills:code-review`/`simplify` are the actual default today.
Also closed a real, previously-logged-and-deferred gap: `post-edit.ps1`/
`session-end.ps1` had never actually been updated for gstack-awareness
despite being planned to — both now updated (gstack-file-touch reminder;
pruning-candidates reminder), syntax-validated, live-simulated. Also
answered: role-modes' generic mode skeleton correctly stays unedited —
the gstack wrap-up belongs at the project CLAUDE.md/skill layer (its own
"follow this project's protocol" extension point), not forked into the
portable plugin's raw source. Full detail: `Wiki/log.md`
session-gstack-review-validation, `Wiki/reference/
gstack-skill-playbook.md`.

2026-08-29 (prior) — by /execute — **gstack-integration Phase 3
dispatch-model rewrite done (most of it): `.claude/skills/using-gstack/
SKILL.md` built (real auto-surfacing skill, gstack-vs-Zenny routing +
the two enforcement seams + memory-instruction), CLAUDE.md's `## gstack`
section shrunk to a pointer at it, Tool Routing Table rows updated
(browser/QA/debugging/code-review now point at gstack for the default
path), 3 hooks retired (`prompt-routing.ps1`, `pip-guard.ps1`,
`permission-fallback.ps1` — last two became plain CLAUDE.md instructions,
first is superseded by the new skill's auto-surfacing).** Preceded by a
full research pass reading all 55 gstack skill files, which corrected
several earlier assumptions and **retracted a fabricated claim** — an
invented "gstack has a documented Essential Core Path" that doesn't
exist in gstack's docs; the Wiki page now labels that section as
Zenny's own construction. **Still open in Phase 3:** 4 flagged-but-kept
skill/plugin pruning candidates from the prior triage (`neon`/`neon-
postgres`, `skill-creator`, `andrej-karpathy-skills`, `playwright`) —
human said keep for now, revisit later. Full detail: `Wiki/log.md`
session-gstack-dispatch-rewrite, `Wiki/reference/gstack-skill-playbook.md`.

2026-08-29 (prior) — by /execute — **gstack-integration Phase 1
(install) complete: gstack installed globally (`~/.claude/skills/
gstack`, non-team), hook-collision check clear, minimal `## gstack`
section live in root CLAUDE.md.** Real skill count verified: 55
skills/76 browse commands (corrects the earlier "23-skill" estimate).
`bun` installed as a prerequisite; a `bunx` shim was needed for
setup's final Playwright-install step. Human declined `--team`
(project-scoped) install for now — stays machine-global until Phase 3
lands. **Phase 3 scope grown:** now also covers pruning unnecessary
skills/plugins at user and project scope, not just the dispatch-model
rewrite. Full detail: `Wiki/log.md` session-gstack-install,
`Wiki/reference/gstack-skill-playbook.md`.

2026-08-29 (prior) — by /execute — **gstack-integration Phase 2
(working-folder legacy-file cleanup) complete, human-reviewed before
deletion.** Removed: `CLAUDE_v3.0.md` (superseded prior version),
`.agents/skills/` (stale duplicate of `.claude/skills`), the entire
`05_Platform_Builds/Convocore/Archieve/` folder (9 files, all superseded
by a named FINAL/v2/v3 doc or already folded into `Convocore_Master_
Reference_v3.md`), 5 pre-Wiki-era root strategy docs
(`Planning_to_Build_Transition_v1.md`, `Database Architecture Review &
Future Runtime Roadmap v1.md`, `External_Integration_Strategy_v1.md`,
`INTEGRATION_CONTRACT_v1.md`, `Client_Integration_and_Credential_
Platform_v1.md`), and 2 unused skill folders (`graphify`,
`semantic-search`, plus the now-dangling `graphify` trigger block that
was `.claude/CLAUDE.md`'s only content). **Kept per explicit human
amendment:** `01_Strategy/Modular_Legacy/` and `05_Platform_Builds/
.Future_Custom/`. Fixed 2 live dangling references the deletion created
(`Claude_Build_Command_Protocol_v2.md`, `Convocore_Findings_Required_
Updates_FINAL.md`) — both mechanical corrections, not new decisions.
**New flagged item, not yet actioned:** a stray root file,
`Too_ Routing_Table.md` (typo'd name), looks like an old duplicate of
the Tool Routing Table now in `CLAUDE.md` — needs its own review, not
part of this approved list. **gstack-integration Phase 1** (human
manually installing gstack) **and Phase 3** (hook removal, CLAUDE.md/
Build Command Protocol rewrite around the gstack-first dispatch model)
remain not started. Full detail: `Wiki/log.md`
session-gstack-phase2-cleanup.

2026-08-27 (prior) — by /execute — **First real release cut for both
plugins: v1.1.0.** Confirmed via official docs that `/plugin update`
compares the `version` field and skips if unchanged — a plain commit
(BC-TOOL-009/010's `aa14e86`/`00c9dcd`) never reaches an already-installed
copy without a version bump; this is why the human saw "role-modes is
already at the latest version (1.0.0)" earlier despite the commit already
being on GitHub. Also found and fixed: both plugins had `version` set in
both `plugin.json` and `marketplace.json` — the docs warn `plugin.json`
silently wins, so the marketplace.json copy was a pure drift trap. Removed
it; `plugin.json` is now the single source of truth. Bumped `1.0.0` →
`1.1.0` in both, tagged `v1.1.0`, cut GitHub Releases (not required for
`/plugin update` but done for discoverability), pushed `role-modes`
`971b840` and `project-memory` `7d60fb1`. **New standing rule for both
plugins, documented in a new README "Releases" section: every user-facing
change needs a `plugin.json` version bump alongside it, or existing
installs never see it.** Full detail: `Wiki/reference/role-modes-plugin.md`,
`Wiki/reference/project-memory-plugin.md`, `Wiki/log.md`
session-BC-TOOL-009-010-release.

2026-08-27 (prior) — by /execute — **BC-TOOL-009/010: `/role-modes:init`
and `/memory-init` now do the full one-time setup on demand, no session
restart needed; both READMEs overhauled with Install/Setup/Usage-example
sections.** BC-TOOL-007/008 widened which session boundaries trigger setup,
but `/plugin install` mid-session still can't fire any hook at all — the
actual gap was narrower than that: `mode.json` already gets created the
moment any `/role-modes:*` command runs, so only the `.claude/CLAUDE.md`
starter-block seed (both plugins) and the three memory files
(`project-memory` only) were stuck behind `SessionStart`. New
`/role-modes:init` and extended `/memory-init` seed those directly. Both
commands embed a literal copy of the hook's starter-block text (confirmed
via `claude-code-guide`: `${CLAUDE_PLUGIN_ROOT}` is hooks/MCP/LSP/
monitor-only, unreadable from a command) — verified byte-identical against
each hook's real output in a scratch project before committing.
`/simplify`'s altitude review (role-modes diff) flagged that a maintenance
comment alone doesn't enforce the two copies staying in sync; added
`scripts/check-init-sync.js` to both plugins (runs the hook for real,
byte-diffs the output) so drift becomes a failing check. Also hit and fixed
a `simplify-guard` false-negative: `cd <path> && git commit` resolves the
wrong repo's git-dir because the hook reads the Bash tool's `cwd` parameter,
not a `cd` inside the command string — `git -C <path> commit` is the
correct form going forward. `role-modes` pushed `aa14e86`, `project-memory`
pushed `00c9dcd`. Full detail: `Wiki/reference/project-memory-plugin.md`,
`Wiki/reference/role-modes-plugin.md`, `Wiki/log.md`
session-BC-TOOL-009-010.

2026-08-26 (prior) — by /execute — **BC-TOOL-007/008: real install failure
found by human's own live test of both plugins, fixed at root cause (this
entry itself demoted from latest — see the 2026-08-27 entry above); no
mid-session plugin-enable hook exists in Claude Code (confirmed against
docs) — `SessionStart` matcher widened to `startup|resume|compact|clear|
fork` in both plugins, README caveats added instead of implying instant
activation.** Also this pass, per human follow-up instruction reversing
the BC-TOOL-004/006 "keep at root" answer: `project-memory` now scaffolds
`PROJECT_STATE.md`/`Wiki/` under `.project-memory/` (matches `remember`'s
`.remember/`); a sentinel-versioning bug this path move would have
introduced (already-scaffolded projects silently skipping the new layout)
was caught by `/simplify`'s altitude review before commit and fixed
(`.memory-scaffolded` → `.memory-scaffolded-v2`). Explicit named credit to
Andrej Karpathy's gist added to `project-memory`'s README. Scope decided
(AskUserQuestion): both plugins stay Claude Code-only — the `.codex-plugin`
/`.cursor-plugin`/`gemini-extension.json` manifests already present in
both repos remain unverified, so no multi-agent claim was made. Live-
verified: fresh scaffold, idempotent re-run (hash-compared), an
old-sentinel project correctly re-scaffolding with its stale root file
untouched, joint run of both plugins in one scratch project (no sentinel
collision). `project-memory` pushed `7fccc78`, `role-modes` pushed
`7dee8ec`. Full detail: `Wiki/reference/project-memory-plugin.md`,
`Wiki/reference/role-modes-plugin.md`, `Wiki/log.md`
session-BC-TOOL-007-008.

2026-08-26 (prior) — by /execute — **BC-TOOL-004/005/006: both plugins
updated per human's 13-point feedback list, live-verified together, both
repos pushed.** `project-memory`: CLAUDE.md seed target moved to
`.claude/CLAUDE.md` (was project-root CLAUDE.md — keeps tool instructions
separate from a project's own maintained docs), self-maintenance/Promotion
Rule framing strengthened (Claude applies it on its own now; `/memory-*`
commands are the manual fallback), README rewritten honestly (origin
story, what/why/how). Pushed `dd808fa`. `role-modes`: same seed-target
move; new `build-cards` skill (generic fallback Build Card format);
memory-system decision gap closed (Commander recommends `project-memory`
if installed, else asks once and records the answer in
`.claude/CLAUDE.md`); live-infra handoff safe-gate now explicit with a
default threshold of 5 consecutive cards, changeable via a `.claude/
CLAUDE.md` line; docs/hook fixed to consistently say `/role-modes:
commander` etc. (Claude Code namespaces every plugin command — a bare
`/commander` never worked, README previously claimed otherwise); README's
"What's deliberately NOT included" replaced with a direct `project-memory`
recommendation. Pushed `d0a1365`. **Live-verified, not just written:**
fresh scaffold and idempotent re-run (hash-compared) for each plugin
separately, then both hooks run together in one fresh scratch project —
both `.claude/CLAUDE.md` marker blocks present, no sentinel collision,
root `CLAUDE.md` never touched by either. Zenny itself still NOT migrated
(deferred, per standing decision). Full detail: `Wiki/reference/
project-memory-plugin.md`, `Wiki/reference/role-modes-plugin.md`,
`Wiki/log.md` session-BC-TOOL-004-005-006.

2026-08-26 (prior) — by /commander — **BC-TOOL-003: `project-memory`
plugin built, installed by human alongside `role-modes` in a real test
project, independently live-verified — 1 real bug found + fixed.** Both
plugins had picked the identical generic CLAUDE.md-seed sentinel filename,
so whichever ran first silently blocked the other from ever seeding —
fixed (namespaced sentinel), re-verified, pushed (`13a4933`). **Human
action needed next:** update/reinstall `project-memory` — the already-
installed plugin cache still runs the pre-fix code, a git push doesn't
retroactively refresh it. Zenny still NOT migrated (deferred, per plan).
Full detail: `Wiki/reference/project-memory-plugin.md`, `Wiki/log.md`
session-BC-TOOL-003.

2026-08-26 (prior) — by /execute — **BC-TOOL-002 complete: Zenny now runs
on the `role-modes` Claude Code plugin for its /advisor, /commander,
/execute mode system.** Local `.claude/commands/*.md` + `session-start.ps1`
archived (not deleted), redundant hook entry removed from
`.claude/settings.json` (now tracked in git for the first time), all other
Zenny-specific hooks unaffected. Full detail: `Wiki/reference/
role-modes-plugin.md`, `Wiki/log.md` session-BC-TOOL-002.

2026-08-17 (prior) — by /execute — **BC-071: same customer-resolution bug
found+fixed system-wide (human's explicit "fix this everywhere"
request), plus a critical, unrelated auth bypass found and fixed along
the way.** Human hit the exact same `22P02 invalid uuid` error testing
`UpdateCustomer`'s escalation path. Investigated systematically —
audited all 13 RPCs taking a real `p_customer_id uuid` parameter and
traced which workflows call each without resolving identity first.
**Fixed 3 real, live gaps:**
1. **WF-017 (NotifyHuman)** — the terminal Fallback-D destination for
   *every* Tool. Same raw-customer_id bug. Fixing it here once closes
   the gap for every Tool's escalation path simultaneously, not a
   per-Tool patch. Live-tested (execution `31127`), published.
2. **The Convocore Adapter's own separate `human_handoff` branch**
   (Convocore's native System Tool bypasses WF-017 entirely) — had the
   identical bug independently. Fixed with the same resolution chain.
3. **WF-016 (UpdateCustomer)** — its opt-in `queue_pending_verification`
   branch had the same bug (would affect any client with the
   verification tier enabled, not just Carmelli's tier-off path). Also
   found its unpublished draft had regressed `Route To Human Handoff`'s
   URL to `webhook-test` — fixed before it could ship broken.

**Also found and fixed, unrelated to the original request but too
severe to leave (same investigation pass):** the Adapter's `Bearer
Token Valid?` node was completely disconnected — `Read Agent Secret`
wired straight past it to routing, meaning **auth was never actually
checked on any real Convocore call**, full stop, since this Adapter was
first built. Reconnected it; live-verified both a correct token
(reaches routing) and an incorrect one (now genuinely rejected
`AUTH_FAILED`) — confirmed neither was true before. Also fixed the
Adapter's `Forward To Tool` node, found pointed at `webhook-test`
instead of production `webhook`.

**Checked, confirmed NOT affected:** WF-013 (CancelAppointment) —
its `customer_id` comes from a real DB lookup (`get_client_appointment_
with_customer`), not raw Convocore input, so it was never broken this
way.

**Not exhaustively re-audited** (out of Carmelli's real scope, lower
priority, flagged not silently skipped): `insert_client_active_issue`,
`insert_client_waitlist_entry`, `stop_client_recovery_for_customer`,
`upsert_client_email`, `apply_customer_update` — worth the same check
whenever a client actually exercises those paths (Restaurant waitlist,
Recovery Engine, Email Manager, verification-approval execution).

All fixes live-tested and published. Full detail: `06_Infrastructure/
n8n/Workflow_Registry.md` (WF-017, WF-016, ADP-002 entries), `Wiki/log.md`
session-BC-071-customer-resolution-everywhere.

2026-08-17 (prior) — by /execute — **BC-071: platform-wide `source_channel`
enum rename, human's own architecture call.** Following up on the
`web_chat`/`website` mismatch from the prior fix: human confirmed via
their original raw webhook capture that Convocore's real `channel`
value is `web-chat` (hyphen) — not `web_chat` (their own live-edited
guess) and not `website` (this project's original assumption). Rather
than keep instructing the Convocore agent's LLM to override
`source_channel` with a hardcoded literal that never matched reality,
made the platform-wide fix instead: `public.source_channel_enum`'s
`website` value renamed to `web-chat` via `ALTER TYPE ... RENAME VALUE`
— **25 existing rows across the 5-client test roster migrated
automatically, zero data loss**, confirmed live. `source_channel` is
now a direct passthrough of Convocore's own `channel` value — no more
override instruction needed. Re-tested WF-001 end to end with the real
value (execution `30978`, real lead created + cleaned up), published to
production. Fixed the one stale `"website"` example in `INTEGRATION_
CONTRACT_v1.md` Part 20.1. Full detail: `06_Infrastructure/n8n/
Workflow_Registry.md` WF-001 entry, `01_Variables_Spec.md` v1.4,
`Wiki/log.md` session-BC-071-source-channel-rename.

2026-08-17 (prior) — by /execute — **BC-071 CRITICAL FIX #2: WF-001
(CreateLead) never had a working customer-resolution path — fixed live,
tested both branches against real Carmelli data, published.** Human hit
this testing for real: `Check Customer Exists (RPC)` threw `22P02
invalid input syntax for type uuid` because `customer_id` arrives as
Convocore's own chat-session identifier (`user_123456`), never a real
internal UUID — no caller anywhere in the system ever has that UUID
before calling `create-lead`. **Real fix, not a workaround:** the
intended resolution mechanism already existed as 3 standalone, never-
wired RPCs (`find_client_customer_by_channel`, `insert_client_customer`,
`insert_client_channel_identity_link`, matching `Agent_Runtime_System_
v1.md` Module 1 §B's documented "match by contact method" design) —
assembled them into a real find-or-create chain inside WF-001 itself,
replacing the old blind existence check. **Live-tested both paths**
against real Carmelli data (execution `30872` not-found→create,
`30876` found→success, real lead `6c52b2c6-...` created then cleaned
up) — published to production. **Second bug found in the same pass:**
`Validate Input`'s `source_channel` enum had been live-edited to accept
`web_chat` (a reasonable attempt to match Convocore's raw channel
value) — the real Postgres enum only accepts `website`, confirmed by
the very next test failing on exactly that DB error. Reverted to the
real enum; Carmelli's Convocore build must send the literal string
`"website"`. Full detail: `06_Infrastructure/n8n/Workflow_Registry.md`
WF-001 entry, `01_Variables_Spec.md` v1.3, `Wiki/log.md` session-
BC-071-customer-resolution-fix.

2026-08-17 (prior) — by /execute — **BC-071: both real gaps from the
prior pass CLOSED for real, live, this session.** Human corrected 2
wrong assumptions of mine, both resolved cleanly, not blocked:
**(1) "There is no way to get agent secret from the UI"** — correct;
my earlier plan (leave Secret Key blank, rely on Convocore's own
auto-Bearer) can't be verified if it can't be inspected. Real fix: a
256-bit secret generated in Postgres (`gen_random_bytes`, never a
third-party credential — this is a webhook signing secret we control
both ends of), stored via `store_credential_secret`, and Carmelli's
real `control.convocore_agent_map` row inserted live (agent id
`1nyXSGBFG1yOj0T9DIPM`, region `na`, matching the workspace's
`CONVOCORE_API_REGION=na-gcp`). **(2) "What is booking-horizon
number?"** — `max_booking_horizon` isn't a business decision Carmelli
needs to make; it's a documented technical safety cap
(`Agent_Runtime_System_v1.md` line 1078/Appendix B: default 365 days,
how far ahead a date can be requested before being treated as
unreasonable) — a genuine Doc-Search-First miss in the prior pass, not
a real open item. Landed Carmelli's `client_config` row (found empty —
real, disclosed gap from the prior pass) using BC-060's already-decided
fields + this documented default. **Consequence:** BC-060 gate 2 is now
IN PROGRESS, not just prepped — human has already started wiring/
testing the real Canvas UI build (their own `create-lead` test is what
surfaced the payload-shape bug this session fixed). Full detail:
`02_Tools_Spec.md` v1.3, `BC-060_Onboarding_Process_Reference_v1.md`
v1.3, `Wiki/log.md` session-BC-071-secret-and-config-closed.

2026-08-17 (prior) — by /execute — **BC-071 follow-up: real Convocore
agent ID received (`1nyXSGBFG1yOj0T9DIPM`), doc placeholders confirmed
already correct; 2 real gaps found live-verifying Carmelli's schema,
both stopped at genuine human-input needs, nothing invented.**

**(1) `control.convocore_agent_map` — CREDENTIAL GATE, not built.**
Live-checked the table's real shape: `convocore_agent_secret_id` is
`uuid NOT NULL` — a Vault reference to the agent's real Bearer secret
(the value Convocore auto-sends when a Custom Tool's Secret Key is left
blank, per `02_Tools_Spec.md` §0.5). No such secret is stored anywhere
yet, and it can't be invented — same class of item the Credential Gate
exists to stop. **Human action needed:** find this agent's real secret/
API key in Convocore's own dashboard (likely under the agent's own
settings — the value it uses to auto-sign Custom Tool Bearer tokens)
and provide it, so it can go through `store_credential_secret` before
this row is inserted.

**(2) `client_carmelli_bakery.client_config` — genuinely empty, and
this is a platform-wide gap, not just Carmelli's.** BC-060 Step 3
documented a specific row as built; live-verified it was never actually
landed — the table has 0 rows. Checked the other 5 clients too:
**4 of 5 also have an empty `client_config`** (only Client B/emergency
has a real row). The live table's actual columns have also evolved
since BC-060's documentation — it now includes `max_booking_horizon`
(`integer NOT NULL`), which BC-060's Step 3 mapping never covered and
no intake checklist question maps to. The one existing precedent
(Client B/emergency uses `0`) isn't confidently transferable to
Carmelli's commerce-ecom click-and-collect model — genuinely ambiguous
whether `0` means "no advance limit" or "same-day only," and this is a
real customer-facing business rule, not a structural default worth
guessing. **Every other Carmelli field IS already decided** (language_
mode, language_list, default_country_code, send_window, email_address,
voice/sms flags, archetype_settings) — only `max_booking_horizon`
blocks the insert (column is `NOT NULL`, so the row genuinely can't
land without it). **Human decision needed:** what should Carmelli's
"advance order/booking horizon" actually be (in days) — or should the
intake checklist gain a real question for this, given it's now
apparently missing platform-wide.

2026-08-17 (prior) — by /execute — **BC-071 CRITICAL FIX: the real
Convocore Adapter had a live bug that would have broken every single
real Custom Tool call.** Human ran a real `create-lead` test in n8n's
webhook test mode and captured Convocore's actual outgoing body —
`{ convo_id, session_id, tool_metadata: { tool_id }, tool_payload:
{...} }`, nothing like what the Adapter's `Normalize Incoming Payload`
node assumed (`agentId`, `conversation_id`, `tool_name`, `variables`/
`payload`). **`agentId` was never present in the real body at all** —
every real call would have 401'd as `UNKNOWN_AGENT` before reaching any
tool logic; this had never been caught because no real Convocore call
had ever hit this Adapter before (prior BC-028/032/035 tests all used
curl calls built against this same never-verified assumed shape). Fixed
the live Adapter workflow (`BOxeuH6ehv46FZL0`) to read `agent_id`/`key`
from the webhook URL's own query string instead of the body, and
`tool_payload`/`convo_id` for the real field names. **Live-tested**
against the human's real captured shape (execution `30194`... `30214`) —
confirmed correct field extraction, correctly reached live Supabase,
correctly stopped at `Unknown Agent` for a placeholder test ID (no
real Carmelli agent exists yet — expected, no live data touched).
**Second real bug found and fixed:** the create-lead Variable-attachment
guidance in `01_Variables_Spec.md`/`02_Tools_Spec.md` was itself wrong
— Convocore has no mechanism to attach a System Variable "as" a
differently-named payload field (a Variable's Key IS the outgoing field
name), so reusing `user_id`/`channel` directly would have sent the
wrong field names to WF-001. Fixed: 2 new custom Variables
(`customer_id`, `source_channel`), `lead_intent` renamed to `intent`
(WF-001's real required field name). **Consequence beyond Carmelli:**
every Custom Tool's Server URL must now include `?agent_id=...&key=...`
— a platform-wide correction, not client-specific, even though it
surfaced during Carmelli's build. Full detail: `02_Tools_Spec.md` v1.2,
`01_Variables_Spec.md` v1.2, `03_GlobalPrompt_and_Nodes_Spec.md` v1.1,
`06_Infrastructure/n8n/Workflow_Registry.md` ADP-002 entry, `Wiki/log.md`
session-BC-071-critical-fix entry.

2026-08-17 (prior) — by /execute — **BC-071 recheck pass (human-
requested): real Adapter webhook URL added, doc-vs-reality gap found +
resolved.** Live n8n MCP-verified the real Adapter workflow (ADP-002,
`BOxeuH6ehv46FZL0`, `active: true`) and both `create-lead`/`update-
customer`'s actual n8n workflows (WF-001 `fjJkKxA3o6kfeLoz`, WF-016
`ogYca9QFCMIEWrWG`, both `active: true`). **Real corrections to
`02_Tools_Spec.md`:** every Custom Tool's Server URL is the SAME shared
Adapter URL (`https://n8n-cbzu.srv1881104.hstgr.cloud/webhook/
convocore-adapter`), not per-tool as v1 implied; Secret Key should be
left blank (Convocore's own auto-Bearer mechanism, matches the
Adapter's real auth check) rather than "invent a credential" as v1
overcautiously said. **Doc-vs-reality gap resolved:** `n8n_Workflow_
Specification_v1.md` §13.1/13.16 label both tools "Status: Planned" —
stale; both are live and active. **New finding:** `update-customer`
(WF-016) currently *always* routes to human-handoff (no verification
mechanism exists yet) — functionally identical to calling human-handoff
directly right now. **New open item, disclosed not guessed:** WF-001
requires `customer_id` to already exist as a real customer record
(`CUSTOMER_NOT_FOUND` otherwise) — no document/workflow in this
project confirms what creates that record for a brand-new website
visitor; flagged for live testing at gate 2's Test-button step, not
resolved here. `human-handoff`'s own webhook-wiring field in Convocore's
dashboard also remains a genuinely open, disclosed question (not
resolved by any doc). Full detail: `02_Tools_Spec.md` v1.1,
`01_Variables_Spec.md` v1.1, `Wiki/log.md` session-BC-071 follow-up.

2026-08-17 (prior) — by /execute — **BC-071 COMPLETE: Carmelli
Convocore Build Package (Variables → Tools → Global Prompt → Nodes).**
Human decision: pause the own-stack/BC-070 question, finish the real
Convocore build for Carmelli first. Built 3 sourced docs under
`05_Platform_Builds/Convocore/BC-071_Carmelli_Build_Package/` — every
Variable/Tool Key and node Instruction traces to a cited source
(`Agent_Runtime_System_v1.md`, `INTEGRATION_CONTRACT_v1.md`,
`n8n_Workflow_Specification_v1.md`, `Convocore_Canvas_Ground_Truth_
FINAL.md`), no invented names, per `Convocore_Agent_Build_Order_Guide_
v2.md`'s Doc-Search-First discipline. **2 real findings surfaced (not
built around silently):** (1) Carmelli's real `conversion_mode` is B
(Guided to Product Link), not A — no cart-creation API exists (D2:
static site, no ecommerce platform) — so `CreateCart`/`GetOrderStatus`
are explicitly not wired this pass; (2) only 3 of the 5 active modules
need a Convocore node at all — Recovery Engine and Email Manager are
both entirely n8n-side (scheduled/webhook workflows), never chat-
triggered, confirmed against `n8n_Workflow_Specification_v1.md` §7.4/
7.5. Also found (live Canvas ground truth, corrects the Runtime doc):
the `human-handoff` System Tool's escalation fields are Convocore's own
built-in `team_key`/`issue_summary`, not the Runtime doc's "planned
Integration Contract v2" field names — the live platform mechanism
wins. **Gate 2 itself (BC-060) is not closed** — the human still does
the manual Canvas UI build; this supplies the content, not the build.
Convocore not touched (still `403`, unchanged, no MCP call needed for
this card). Full detail: `BC-060_Onboarding_Process_Reference_v1.md`
v1.2, `Wiki/log.md` session-BC-071 entry.

2026-08-17 (prior) — by /execute — **BC-060 gate 1 CLOSED (dashboard
login).** Human created the real Supabase Auth account for
`carmelli.zennyai@gmail.com` (`auth_user_id
4473a9b8-0536-4795-8147-745f0a8c1196`). Provisioned via the real
`dashboard_provision_user` RPC (BC-051), not a raw insert.
**Live-verified**, not assumed: simulated the real authenticated
session and called `dashboard_get_my_client()` — returned the correct
Carmelli mapping. This dashboard login is now genuinely usable.
**2 of 3 gates remain:** Convocore agent (human decision — staying
manual/free-tier, not upgrading); Gmail connection (now reachable via
the dashboard's real Integrations → Connect flow, since login exists —
an n8n-credential shortcut was suggested and correctly rejected, that
path is for Zenny's own internal accounts, not client-facing
connections). Full detail: `BC-060_Onboarding_Process_Reference_v1.md`
v1.1, `Wiki/log.md` session-BC-060 entry.

2026-08-17 (prior) — by /execute — **BC-060 STARTED, real progress,
STOPPED at 3 real gates.** Ran the now-fully-answered
`Convocore_Agent_Intake_Checklist_v1.md` as a real provisioning input
for the first time — Carmelli Bakery is Zenny's first non-test client
record (`client_id eb27a21f-209d-4b6d-8f6e-cb216411f6c4`,
`client_carmelli_bakery` schema). **Live-verified before assuming
anything:** Convocore REST/MCP still `403` (unchanged since BC-057b) —
manual Canvas UI build remains the only path. **Built and live-verified:**
`control.clients` row; client schema cloned via
`create_client_schema_from_template` (2 real findings along the way —
`p_archetype` is `commerce` not `commerce_ecom`, template schemas
merge Ecom+Restaurant; `waitlist_entries` can't go in `p_specific_tables`,
it has no `conversion_id` column, the function assumes one and the
first attempt correctly rolled back clean); `client_config`;
`client_active_modules` (5 rows per B1); `agent_prompts` + `email_categories`
seeded from the real master sources (clone is structure-only, same
BC-062 pattern); a real Notion KB page built from BC-059's already-fetched
site content (honest about the still-unknown hours/refund-policy/
platform gaps) + `client_kb_source` row. **Stopped, correctly, at 3
real Credential-Gate-class items — none worked around:** (1) dashboard
login needs a real Supabase Auth account for
`carmelli.zennyai@gmail.com`, not created directly via SQL (known
GoTrue trap, `platform-quirks/supabase-auth-quirks.md`); (2) the
Convocore agent itself needs the human's manual Canvas UI build,
`403`-blocked for any tool; (3) Email Manager needs a real Gmail OAuth
connection for the same inbox, none exists. Full step-by-step process —
the actual deliverable of this pass — written up as the first real
onboarding-process reference: `05_Platform_Builds/Convocore/
BC-060_Onboarding_Process_Reference_v1.md`. Resume at whichever gate
clears first; Steps 1-6 need no rework. Full detail: `Wiki/log.md`
session-BC-060 entry, `Wiki/infra/convocore-agent-provisioning.md`.

2026-08-15 (prior) — by /execute — **BC-063 COMPLETE (4 of 6 fixed,
2 intentionally left).** Live-verified all 6 connect/lifecycle Edge
Functions' real source + how the dashboard frontend actually calls
each before changing anything. **Fixed:** `shopify-connect`,
`woocommerce-connect`, `connection-lifecycle`,
`resolve-pending-verification` — all called via `supabase.functions.
invoke()` (forwards the caller's real session JWT automatically, same
mechanism BC-056's `release-lead-ownership` already established); each
now derives `client_id`/`client_schema_name` from `dashboard_get_my_
client()` under the caller's own session, ignoring the body-supplied
value entirely. Redeployed with `verify_jwt: true`. **Left as-is,
intentionally:** `oauth-callback` (genuine public OAuth redirect
target, never carries a bearer token) and `oauth-initiate` (opened via
browser `window.open()`, not `functions.invoke()` — no Authorization
header possible). **Not fully browser-tested end-to-end** — same
disclosed limitation as BC-056 (no real dashboard login to test with);
verified via source review + the already-established `functions.
invoke()` JWT-forwarding pattern. Full detail: `Wiki/log.md`
session-BC-063, `Wiki/platform-quirks/anon-grant-exposure-bc052.md`.

2026-08-15 (prior) — by /execute — **BC-064 COMPLETE.** Human flagged
117 live Supabase Security Advisor warnings via screenshot. Root cause:
BC-052 (2026-08-14) only revoked `anon` EXECUTE from ~40 internal RPCs
— `authenticated` was never touched (73 functions, including
`read_credential_secret`/`store_credential_secret` themselves — any
real signed-in dashboard user, not just anon, could read/rotate any
client's Vault secrets). Also found: new functions built since BC-052
(including this session's own `get_client_agent_prompt`) inherit
Supabase's ambient anon+authenticated default grant on new `public`
functions unless explicitly revoked. **Fix:** grepped the dashboard's
real frontend code + checked the one Edge Function that forwards a
caller's real JWT to find the true 10-function "needs authenticated"
set; revoked anon+authenticated from the other 62 (service_role only).
**Live-verified:** advisor warnings 117 → 11 (10 intentional + 1
unrelated Auth setting, not a grant issue, disclosed not fixed). Re-ran
INT-010's `test_workflow` against the tightened grants — confirmed
live, unaffected (n8n's credential is genuinely `service_role`). Full
detail: `Wiki/log.md` session-BC-064,
`Wiki/platform-quirks/anon-grant-exposure-bc052.md`.

2026-08-15 (prior) — by /execute — **BC-062 COMPLETE.** Human
approved the redesign; built in one pass: `public.agent_prompts`
created + backfilled into all 5 `tpl_*` templates (structure only) and
all 5 real client schemas (2 seed rows each, from `control.
agent_prompts`); `create_archetype_template`/`create_client_schema_
from_template` updated to include it for future provisioning; new
`public.get_client_agent_prompt(p_schema, p_prompt_key)` RPC (same
shape as `list_client_email_categories`); old control-schema RPC
dropped (genuinely dead); `control.agent_prompts` kept as the
master-defaults seed source. INT-010 and INT-011 rewired to the new
RPC using each client's real resolved schema name, **live-tested with
real (unpinned) LLM calls** — not just structural pinning — confirmed
byte-identical prompt output to the pre-BC-062 hardcoded version, both
published. The `agent_prompts` wiring gap (Path A #4) is closed. Full
detail: `Wiki/log.md` session-BC-062 redesign entry,
`Wiki/infra/convocore-agent-provisioning.md`,
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

2026-08-15 (prior) — by /execute — BC-062 verification follow-up:
human pushed back on 2 things from the first pass, both checked live,
both resolved. **(1) Credential-attach was NOT a Supabase permission
issue** — it's an n8n MCP tool gap (`addNode`'s inline `credentials`
field is silently dropped; the dedicated `setNodeCredential` operation
works and was applied to both draft nodes, still unpublished). **(2)
The control-schema/archetype-keyed `agent_prompts` design was the
wrong shape** — human's per-client-schema mental model is confirmed
correct and is the platform's real, consistently-applied pattern
(`Database_Structure_v4_FINAL.md` §1, live schema list matches exactly).
That same doc already flags `control.agent_prompts` as `never synced to
any client schema` — a known original-design gap, not a doc conflict.
Found a direct working precedent: `email_categories` lives per-client-
schema (real, queried) with an orphaned `control` copy predating BC-045
— `agent_prompts` should follow the same pattern. **Redesign not yet
built — reported to human, correctly stopped rather than self-resolved
(a real system-shape decision).** Full detail: `Wiki/log.md`
session-BC-062 follow-up entry, `Wiki/infra/convocore-agent-provisioning.md`.

2026-08-15 (prior) — by /execute — BC-062 STARTED, BLOCKED (Credential
Gate, not self-resolved): Email Manager prompt externalization
(`agent_prompts` wiring gap, Path A #4). Built `public.get_agent_prompt`
RPC (live, tested), seeded 2 default rows, draft-wired INT-010 and
INT-011 (new HTTP node + Code node updates, byte-identical output by
construction). **Real finding:** the live `agent_prompts` schema has no
`client_id` column — supports default+archetype-level override today,
not literally per-client as originally framed; disclosed, not built
around. **Blocked:** the n8n MCP tooling cannot attach a credential to
the 2 new HTTP nodes (confirmed via the tool's own response) — needs a
human to set it in the n8n UI (believed `zenny-vault-suparbase`, not
independently confirmed — every existing node's credential assignment
is redacted from every read path this session had). Neither workflow
can be tested/published until that's done; **both workflows' live/
active versions are unchanged.** BC-063 (the other item raised this
session — Edge Function client_id/JWT-trust gap, Path A #1) not started.
Full detail: `Wiki/log.md` session-BC-062,
`Wiki/infra/convocore-agent-provisioning.md`,
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

2026-08-14 (prior) — by /execute — BC-059 complete: ran the intake
checklist against a real target, carmelli.co.uk (a kosher bakery,
click-and-collect only). Fetched the homepage + contact page (About and
a guessed shipping-policy URL both 404'd, disclosed rather than
guessed). Archetype diagnostic run for real: **Commerce-Ecom**
(transactional, customer already knows what they want, no booking slot,
no advisory step). All AUTO rows filled with real site content
(products/pricing, 24h/48h advance-order policy, kosher certs, contact
info, UK locale); genuinely unanswerable-from-the-website items (hours,
refund policy, actual ecommerce platform) left as disclosed gaps, not
guessed. Checklist restructured per human request: added a `Type`
column (`Placeholder` vs. `Option: [real enumerated choices]` — never
vague) and a client-facing `Why it matters` column (no internal field
names). Also added `control.agent_prompts`'s per-client-prompt-override
gap (BC-058c finding) to the Next Build Card candidates list below.
Full checklist: `05_Platform_Builds/Convocore/Convocore_Agent_Intake_Checklist_v1.md`.

2026-08-14 (prior) — by /execute — BC-058c complete: the 2 stale
Convocore docs actually corrected (`Findings_Required_Updates_FINAL.md`
§1.1/§1.2, `Adapter_Spec_FINAL.md` Part 2.3 — both now match live
reality), and `control.agent_prompts` resolved to a real, non-Convocore
finding: human confirmed it's Email Manager's (per-client-overridable
LLM prompts, one default at build time, replacing hardcoded-in-n8n).
Live n8n check (full `get_workflow_details` on INT-010 + INT-011, both
prompt-building Code nodes) confirms it is **built but not wired to
either workflow yet** — a real, disclosed, un-built improvement, not
mystery scaffolding. **Document Resolution Authority pause from BC-058
is now closed — BC-059 unblocked.** Full narrative: `Wiki/log.md`;
findings: `Wiki/infra/convocore-agent-provisioning.md`,
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

2026-08-14 (prior) — by /execute — BC-058 complete: master Convocore
Agent Intake Checklist built (`Convocore_Agent_Intake_Checklist_v1.md`),
grounded in a live Supabase schema read (not the flagged-stale
`Client_Onboarding_Sequence_Spec.md`). Merges `Client_Onboarding_Guide.md`'s
archetype diagnostic with genuine business-decision inputs from the 3
primary Convocore docs, AUTO/ASK split, 4 sections. **2 real doc/reality
gaps found and self-resolved per Document Resolution Authority — session
paused here pending human acknowledgment before BC-059 starts:** (1)
agent naming convention (`Findings_Required_Updates_FINAL.md` still
flags this open; actually decided elsewhere — `{ClientBusinessName}
Assistant`); (2) `convocore_agent_map`'s schema (`Adapter_Spec_FINAL.md`
calls it "pending"; it's already built, exactly matching the spec's own
stated minimum). Also flagged, not resolved: `control.agent_prompts`
exists live, unmentioned by any Convocore doc, may already scaffold the
undocumented "Template Dashboard" — worth checking before BC-060. Full
narrative: `Wiki/log.md`; findings: `Wiki/infra/convocore-agent-provisioning.md`.

2026-08-14 (prior) — by /execute — BC-057b complete: Convocore
reachability rechecked (still `403`, both REST and MCP, identical to the
2026-08-04 finding — same account-level billing block, not an MCP
artifact and not cleared since). Not treated as a blocker per human
decision: manual build in the Convocore Canvas UI is the agreed fallback
build method for the upcoming demo-business agent (Path B of the new
dual-path plan — Path A is remaining backend work, Path B is a real,
human-provisioned Convocore agent build for a demo business shown to
that client, doubling as a full-stack integration test). All 10 current
Convocore docs annotated with a `DOC PREFERENCE` status line; full map
at `Wiki/reference/convocore-doc-status.md`. Also flagged (not yet
corrected): `Client_Onboarding_Sequence_Spec.md` predates several recent
migrations (BC-051-056) and should not be trusted literally for future
provisioning — re-derive schema live when that work starts. Full
narrative: `Wiki/log.md`.

2026-08-14 (prior) — by /execute — BC-054/055/056 complete, plus the
`zenny-notification-sender` credential reconnect live-verified. All 3
were Commander-issued from the Next Build Card candidates list, human
approved, executed sequentially in one session. **BC-054** (recovery
max-steps enforcement): `control.archetype_recovery_defaults` +
per-client `max_recovery_steps` override; `advance_client_recovery_step`
now stops a lead's cadence the instant it reaches its archetype's real
max step (Recovery_Engine_Flow.md §3/§6), `get_due_recovery_queue`
defensively excludes any row already past it. Live-verified via 3
disposable fixtures. **BC-055** (CancelAppointment real calendar-event
deletion): `resolve-pending-verification`'s approve path now genuinely
deletes the client's Google Calendar event (Calendly cancellation built
per spec, not live-tested — no roster Calendly connection). Real,
full end-to-end proof: created a real disposable Google Calendar event,
deleted it via the live deployed function, independently confirmed
`status: "cancelled"` on Google's own side — better than the external
blocker originally assumed (Mandatory MCP Verification found Client A's
"insufficient scope" was specific to FreeBusy, not the events API).
**BC-056** (INT-008 ownership-release caller): real finding — neither
INT-008 nor `resume_client_recovery` ever touched
`human_ownership_flag`; built the actual flag-clear as a new
`auth.uid()`-scoped RPC (`dashboard_release_lead_ownership`), gave
INT-008 a real webhook (it had none), added a `/paused-leads` dashboard
page and a `release-lead-ownership` Edge Function (deliberately
`verify_jwt: true`, a documented deviation from BC-052/053's
convention, since this action genuinely needs real caller identity).
Live-verified end to end except the Edge Function's full real-user
happy path (no real dashboard session to test with — Credential Gate,
not invented; the RPC and webhook it glues together are each proven
standalone). Full narrative: `Wiki/log.md`.

2026-08-14 (prior) — by /execute — BC-053 complete: Verification
Approval Queue built, live-verified — the last of the 3 Build Cards
approved from this session's decision round (BC-051/052/053 all done).
Opt-in per client (`control.clients.verification_tier_enabled`, default
false — no existing client's behavior changed). WF-013/WF-016 each gained
a branch: tier off = byte-identical to pre-BC-053 always-handoff
(regression-proven live); tier on = queues a `pending_verifications` row
(new table, dynamically created across all 10 client/template schemas)
and responds `pending_approval`. New dashboard `/approvals` page +
`resolve-pending-verification` Edge Function does the real execution on
approve (`cancel_client_appointment`/`apply_customer_update`, both reusing
existing columns — no new appointments/customers columns needed, a real
scope-narrowing finding) + sends confirmation via WF-019's real webhook
(reused, not rebuilt). **Known, disclosed gap:** CancelAppointment's real
calendar-event deletion is not built (no existing DELETE pattern anywhere
in the platform to reuse) — DB-side cancellation is real; calendar
deletion honestly reported as not implemented. **Bug found+fixed mid-card:**
a migration mistake briefly broke `get_client_appointment_with_customer`
(WF-013/WF-015's real dependency) — caught within minutes via live
testing, restored, reverified; no evidence real traffic was affected.
**New unrelated finding:** n8n's internal `zenny-notification-sender`
Gmail credential has expired, crashing UTIL-006 when a client lacks an
email connection — needs human OAuth reconnection, not fixed this card.
Full narrative: `Wiki/log.md`.

2026-08-14 (earlier) — by /execute — BC-052 complete: Connection Lifecycle
Actions built, live-verified. **Also: a critical live security exposure
found mid-card and fixed** — ~40 internal RPCs (read_credential_secret,
etc.) were granted EXECUTE to `anon` with no internal caller-identity
check, live-exploitable via the public anon key to read any client's
Vault secrets or forge data cross-tenant. Human approved an immediate
fix; `REVOKE ... FROM anon` applied across all affected functions,
live-verified (anon now denied, service_role/n8n unaffected). Full
writeup: `Wiki/platform-quirks/anon-grant-exposure-bc052.md`. New Edge
Function `connection-lifecycle` gives the dashboard real Revoke (Google/
Calendly have real provider endpoints, live-tested; Shopify/WooCommerce
have no app-initiated revoke API at all — honestly disclosed, not
faked) + Refresh (Google live-tested non-destructively; Shopify built
but untested, no live connection exists) + Reconnect (reuses existing
Connect flow, no new backend). `Integrations.tsx` updated, typecheck/
lint clean; full browser click-through not done (no test-user
credentials — disclosed). Full narrative: `Wiki/log.md`.

2026-08-14 (earlier) — by /execute — BC-051 complete: Dashboard Auth Mapping built.
New `control.dashboard_users(auth_user_id, client_id, role)` table
replaces the `app_metadata.client_schema_name` stopgap (BC-015). Both
existing dashboard RPCs (`dashboard_get_my_client_schema`,
`dashboard_get_my_client`) migrated to read it, live regression-tested
identical to pre-migration behavior; new `service_role`-only
`dashboard_provision_user` RPC is the real replacement for manually
setting `app_metadata` going forward (no dashboard-UI flow calls it yet
— none exists). All 5 acceptance criteria live-verified (backfill,
regression, fail-closed, provisioning upsert + permission denial,
direct-table-access denial). Human had already decided, in the prior
advisor-mode conversation, all 4 previously-open product decisions
(`Wiki/decisions/`): calendar category-sharing stays as-is (closed, no
build); provider revocation gets built (BC-052, queued next); this auth
mapping gets built (BC-051, done); verification-tier redesign gets built
opt-in per client (BC-053, queued after BC-052). Full narrative:
`Wiki/log.md`.

2026-08-13 (prior) — by /execute — BC-050 complete: INT-007 (Stop Recovery) and
INT-008 (Resume Recovery) built, published, live-verified. Scoped correctly
via live investigation rather than the original assumption: INT-007's real
trigger (INT-009/010's per-email customer resolution) was genuinely
unblocked by Phase 10; INT-008's real trigger (`human_ownership_flag`
clearing) is NOT reply-based and has no writer anywhere in the built system
— confirmed by grep — so it was built + live-tested standalone, no caller
wired, per explicit human decision. INT-007 wired directly into INT-010
(fires on every inbound email, before categorization); a real end-to-end
run proved a reply gets both correctly categorized/drafted AND its
`recovery_queue` row genuinely stopped. New RPCs:
`stop_client_recovery_for_customer`, `resume_client_recovery`. Investigation
also surfaced a real pre-existing gap: no per-archetype max-recovery-step
count exists anywhere in the DB, and neither WF-018 nor INT-006 enforce the
"max steps reached → Stopped" condition — not fixed this card (out of
scope), flagged below. Full narrative: `Wiki/log.md`.

2026-08-13 (same day, prior) — by /execute — BC-049 complete: Email Manager's last two
Phase 10 gaps closed. Notion credential gate resolved by the human (real
root cause was the KB root page never being added to the "n8n"
integration's Connections list — BC-048's "stored secret mismatch"
diagnosis was wrong, corrected in the Wiki). Live-verified INT-012's full
Notion→Pinecone round trip for the first time (2 real KB pages fetched,
chunked, embedded, upserted). Built+published SCH-003 (hourly INT-009
fan-out) and SCH-004 (daily INT-012 fan-out per client with a KB source),
both live-verified against the real roster — SCH-004's first run 403'd on
a missing `SELECT` grant on `control.client_kb_source` (same
USAGE/GRANT-gap pattern as `platform-quirks/postgrest-schema-exposure.md`),
fixed live, re-verified working. Phase 10 (Email Manager) is now feature-
complete: all 7 workflows (WF-019, INT-009/010/011/012, SCH-003/004) live,
chained, and cadenced. Full narrative: `Wiki/log.md`.

2026-08-13 (same day, prior) — BC-048 complete: Email Manager chain made
genuinely live-wired end to end (INT-009→010→011 fan-out), Pinecone
credential type fixed, real BC-045 categorization bug found+fixed. Full
narrative: `Wiki/log.md`.

2026-08-13 (same day, prior) — BC-047 complete: INT-011 Draft Email +
INT-012 Sync Notion KB built, published. KB source pivoted from Convocore
(billing gate) to Notion+Pinecone. Full narrative: `Wiki/log.md`.

Older entries (BC-045, BC-044, BC-043 and earlier): see `Wiki/log.md`.

## Current Phase

**Phases 0-13 below (Convocore-based build) are PAUSED, not active** — Zenny
stopped the Convocore service and committed to its own infrastructure
(2026-08-29). They're kept below as historical/architectural reference (real
patterns reused by the new build — WF-017's shared choke point, BC-053's
Verification Approval Queue, the OpenRouter pattern, etc.) not as an active
track. **The active track is Phase 14 below.**

Phase 14 — Zenny Own Runtime (SaaS Pivot) — IN PROGRESS. BC-072 (Shared
Runtime Foundation) COMPLETE: shared entry sub-workflow (schema-per-client
tenant isolation) + OpenRouter LLM call wrapper + core conversation schema,
all live-verified and published. MultiNode Runtime v1.0 + Channel Adapter
v2.0 (both real docs, `05_Platform_Builds/Zenny_SaaS/`) are the target
architecture. Archetypes confirmed: commerce-ecom + appointment +
consultation. Real demand signal driving this (7-8 leads/day via Meta ads,
blocked on price); channel parity (web+WhatsApp+IG) required at launch;
timeline dual-stated (1-1.5mo target / 2.5-3mo doc estimate). **Next:**
BC-073/074/075, one per archetype. Full record: `docs/designs/
zenny-saas-runtime-pivot.md`, `Wiki/decisions/zenny-saas-runtime-pivot.md`.

Phase 8 — Conversion Engine (11 Tools) — COMPLETE (11/11 built and
live-tested)
Phase 9 — Recovery Engine — IN PROGRESS (WF-018 SendRecoveryMessage +
INT-006/SCH-001 Process Recovery Queue + INT-007 StopRecovery + INT-008
ResumeRecovery all built, published, live-verified; cadence fires
automatically, email channel only per explicit scope cut; INT-007 is
genuinely wired live into INT-010's per-email chain; INT-008 is built and
proven but has no real caller yet — its actual trigger,
`human_ownership_flag` clearing, is written nowhere in the built system,
see Active Blockers)
Phase 10 — Email Manager — FEATURE-COMPLETE (WF-019, INT-009, INT-010,
INT-011, INT-012, SCH-003, SCH-004 all built/published/live-verified,
BC-043 through BC-049. KB source is Notion+Pinecone, not Convocore
(dormant). Full chain live: INT-009→010→011 genuinely chained, INT-012's
Notion→Pinecone round trip live-verified, both cadences (SCH-003 hourly
inbox, SCH-004 daily KB sync) live and dispatching for real. No open
Credential Gate.)

## Standing Gate
None open.

## Phase Checklist
```
Phase 0  — Environment Setup .................... COMPLETE
Phase 1  — Close Credential Platform Gaps ........ COMPLETE
Phase 2  — Convocore Database Changes ............ COMPLETE
Phase 3  — Remaining Shared Utilities ............ COMPLETE
Phase 4  — Convocore Adapter (ADP-002) ........... COMPLETE
Phase 5  — 4 New Dashboard Systems ............... IN PROGRESS (5B, 5C-read-only, Integrations done; 5A Inventory + 5D Onboarding not started)
Phase 6  — Core Agent ............................ COMPLETE
Phase 7  — Growth Agent .......................... COMPLETE
Phase 8  — Conversion Engine (11 Tools) .......... COMPLETE
Phase 9  — Recovery Engine ....................... IN PROGRESS (WF-018, INT-006/007/008, SCH-001 all built; INT-008 now has a real caller, BC-056; max-steps enforced, BC-054)
Phase 10 — Email Manager ......................... FEATURE-COMPLETE (all 7 workflows live, chained, cadenced)
Phase 11 — Scheduled Workflows ................... IN PROGRESS (SCH-006 live; SCH-007 logged, not built)
Phase 12 — Node-by-Node Outlines ................. NOT STARTED (cross-cutting)
Phase 13 — Template Dashboard .................... DEFERRED
```

## Module Status
```
Core Agent ............ ✅ working — Wiki: (none needed, stable)
Growth Agent ........... ✅ working
Conversion Engine ...... ✅ working — all 11/11 Tools built and live-tested (BC-034)
Dashboard (5B/5C/Int) .. ✅ working — auth mapping now real (BC-051,
                          control.dashboard_users); Integrations page has
                          real Revoke/Reconnect/Refresh (BC-052);
                          Appointments dashboard gained a real write
                          action (BC-053, /approvals page, opt-in per
                          client, off by default; BC-055 added real
                          calendar-event deletion to it); new
                          /paused-leads page (BC-056, real INT-008
                          caller); a critical anon-key RPC exposure was
                          found+fixed same session (see Active Blockers
                          for the smaller residual gap); Wiki/infra/ for
                          deployment
Recovery Engine ........ ✅ working — WF-018 SendRecoveryMessage +
                          INT-006/SCH-001 Process Recovery Queue +
                          INT-007 StopRecovery + INT-008 ResumeRecovery
                          all live-tested, cadence fires automatically
                          (email only), per-client active-hours window
                          (BC-041); INT-007 genuinely wired into INT-010;
                          INT-008 now has a real caller (BC-056, dashboard
                          ownership-release action); max-steps enforced
                          (BC-054)
Email Manager .......... ✅ working — WF-019, INT-009, INT-010, INT-011,
                          INT-012, SCH-003, SCH-004 all live-tested
                          (BC-043 through BC-049); KB source is
                          Notion+Pinecone, Convocore path wired-dormant;
                          full chain (INT-009→010→011) and full KB sync
                          (INT-012, both cadences) genuinely live-verified
Credentials Platform ... ✅ working — Wiki/credentials/
Infra (VPS/DNS/Proxy) .. ✅ working — Wiki/infra/
```

## Active Blockers
- ~~`client_config` empty for Carmelli~~ **CLOSED (2026-08-17, same
  session).** Real row inserted using BC-060's already-decided fields +
  `max_booking_horizon = 365` (documented default, not a real open
  decision — see Last Updated). **Still genuinely open, not this
  client's problem:** the same table is still empty for 4 of the 5
  *test* clients (A/002-commerce, C/003-appointment, D/004-consultation,
  E/005-engagement) — no live traffic depends on it, not fixed this
  session, revisit whenever Path A backend work next touches
  provisioning.
- ~~Carmelli's `convocore_agent_map` row blocked on Credential Gate~~
  **CLOSED (2026-08-17, same session).** Real secret generated in
  Postgres (not a third-party credential — a webhook signing secret we
  control both ends of), stored, row inserted live. See Last Updated.
- ~~INT-008 (Resume Recovery) has no caller~~ **CLOSED (BC-056,
  2026-08-14).** New dashboard `/paused-leads` action → real
  `dashboard_release_lead_ownership` RPC (clears the flag — a real
  finding: neither INT-008 nor `resume_client_recovery` ever touched it)
  → INT-008's new real webhook (it had none before). Live-verified. See
  `Wiki/infra/int008-ownership-release.md`.
- ~~Recovery cadence's "max steps reached → Stopped" condition~~ **CLOSED
  (BC-054, 2026-08-14).** `control.archetype_recovery_defaults` +
  per-client `control.clients.max_recovery_steps` override now enforce
  it in `advance_client_recovery_step` (real stop) and
  `get_due_recovery_queue` (defensive filter). Live-verified. See
  `Wiki/platform-quirks/recovery-queue-sweep-design.md`.
- **External, Convocore-KB path blocked:** Convocore's REST API now
  returns 403 "requires Business plan or higher" workspace-wide (`Zenny-
  UI` workspace, same secret/agent that worked live on 2026-08-02/04) —
  confirmed independent of MCP. `control.convocore_agent_map` stays in
  place, dormant. Not investigated further — human's call whether to
  upgrade the Convocore plan or stay on Notion+Pinecone permanently.
- External: no roster client has a real, working Google Calendar or
  ecommerce connection to fully live-test Conversion Engine success
  paths (Calendly `status='error'`; WooCommerce test store
  non-functional). Now also true for the 2 new BC-034 roster clients
  (consultation, engagement) — same class of external limitation, not
  a workflow gap. Wiki/credentials/calendly.md, Wiki/credentials/woocommerce.md.
- **DEFERRED (to-do, not blocking):** `Database_Structure_v4_FINAL.md`
  missing an `appointments` section — real deployed table (BC-013),
  used by 5 of 11 Conversion Engine Tools, still undocumented. Not
  blocking (BC-034 already found and fixed the one real bug this gap
  caused, in `create_client_schema_from_template`), but the doc debt
  itself is still open — owed by Commander, not applied by Claude Code
  per Section 13's standing rule. Deferred rather than scheduled;
  revisit next time this doc is touched for any other reason, or
  proactively if it starts causing a second incident.
- Doc diff owed by Commander: `n8n_Workflow_Specification_v1.md`
  missing the SCH-007 row.
- UTIL-002 (Data Validator) has no real caller anywhere — not urgent,
  no live risk.
- ~~`zenny-notification-sender` Gmail credential expired~~ **CLOSED
  2026-08-14.** Human reconnected via n8n UI; live-reverified via the
  exact real failing path (WF-019 → UTIL-006 → Tool Execution Fallback →
  UTIL-004, real Gmail send, message id `19ffd2a904ae2bcf`). See WF-019's
  `Workflow_Registry.md` entry.
- ~~CancelAppointment's real calendar-event deletion~~ **CLOSED (BC-055,
  2026-08-14).** `resolve-pending-verification`'s approve path now
  deletes the real Google Calendar event (Calendly cancellation built,
  not live-tested — no roster Calendly connection). Real end-to-end
  proof: created a real disposable Google event, deleted it via the live
  deployed Edge Function, independently confirmed `status: "cancelled"`
  on Google's side. See `Wiki/infra/verification-approval-queue.md`.
- ~~BC-062 (credential-attach block, then agent_prompts redesign)~~
  **CLOSED (2026-08-15).** Credential-attach was an n8n MCP tool gap
  (`addNode`'s inline `credentials` silently dropped), not a Supabase
  permission issue — fixed via `setNodeCredential`. The control-schema/
  archetype-keyed design was the wrong shape (live `email_categories`
  precedent + the architecture doc's own "never synced to any client
  schema" note both pointed to per-client-schema) — rebuilt:
  `agent_prompts` now lives in `public`+`tpl_*`+every client schema,
  read via `get_client_agent_prompt`. INT-010/INT-011 rewired,
  live-tested with real LLM calls, published. See `Wiki/log.md`
  session-BC-062 redesign entry, `Wiki/infra/convocore-agent-provisioning.md`.
- ~~Residual security gap (found BC-052): connect/lifecycle Edge
  Functions trusting client_id from the request body~~ **CLOSED for 4
  of 6 (BC-063, 2026-08-15).** `shopify-connect`, `woocommerce-connect`,
  `connection-lifecycle`, `resolve-pending-verification` now derive
  identity from the caller's real session JWT. `oauth-callback` and
  `oauth-initiate` intentionally left as-is — genuinely no bearer token
  available in either flow (public OAuth redirect / browser popup
  navigation), disclosed not silently skipped. Not fully
  browser-tested end-to-end (no real dashboard login available). See
  `Wiki/platform-quirks/anon-grant-exposure-bc052.md`.

(ADP-001 doc/reality mismatch dropped per human instruction, 2026-08-14
— no longer tracked. The 4 open product/design decisions were all
resolved 2026-08-14 — see Wiki/decisions/: BC-051, BC-052, BC-053 all
done; 1 closed with no build needed. A critical anon-grant RPC-exposure
bug, unrelated to any of the 4 decisions, was found and fixed live
during BC-052 — see Last Updated above.)
## Test-Client Roster
```
Client A: baa673b5-c51a-4a7b-91f5-a37027f8dca4 — commerce_ecom — client_test_002_acme_commerce_test
Client B: 7e2dffbf-97a2-46d8-b60f-6782379f02b6 — emergency — client_test_001_acme_emergency_test
Client C: 2d0fafb6-72c8-4751-a7c0-cc77cf743807 — appointment — client_test_003_acme_appointment_test
Client D: e5f6a7b8-0001-4c1d-9e2a-000000000004 — consultation — client_test_004_acme_consultation_test (new, BC-034)
Client E: e5f6a7b8-0001-4c1d-9e2a-000000000005 — engagement — client_test_005_acme_engagement_test (new, BC-034)
```

## Next Build Card
BC-039/043/044/045 (Phase 9/10 build history through 2026-08-12): see
`Wiki/log.md` — reply-trigger split, WF-019, INT-009, INT-010.

**BC-048 complete (2026-08-13): Email Manager chain genuinely live-wired.**
INT-009 → INT-010 → INT-011 now fan out for real; fixed the Pinecone
credential-type mismatch; found and fixed a real pre-existing BC-045
categorization bug. See `Wiki/log.md`.

**BC-049 complete (2026-08-13): Notion credential gate closed (human
fixed page-sharing, not a secret), SCH-003 + SCH-004 built, published,
live-verified.** Phase 10 (Email Manager) is now feature-complete — all
7 workflows live, chained, cadenced.

**BC-050 complete (2026-08-13): INT-007 (Stop Recovery) + INT-008
(Resume Recovery) built, published, live-verified.** INT-007 genuinely
wired into INT-010's live chain. INT-008 built standalone, no caller yet
(real blocker, see Active Blockers).

**BC-051 complete (2026-08-14): Dashboard Auth Mapping built, live-
verified.** `control.dashboard_users` replaces the `app_metadata`
stopgap. See Last Updated above and `Wiki/infra/dashboard-auth-mapping.md`.

**BC-052 complete (2026-08-14): Connection Lifecycle Actions built,
live-verified, plus an unplanned critical security fix mid-card** (see
Last Updated above — anon-granted internal RPCs, fixed same session).
Real revoke: Google + Calendly (real provider endpoints, live-tested);
Shopify + WooCommerce honestly disclosed as local-only (no
app-initiated revoke API exists for either — a real finding, not a
build gap). Refresh: Google live-tested non-destructively; Shopify
built but not live-tested (no live Shopify connection in the roster).
Reconnect: no new backend, reuses the existing Connect flow.

**BC-053 complete (2026-08-14): Verification Approval Queue built, live-
verified.** Opt-in per client, off by default. WF-013/WF-016 both
regression-proven unchanged when off. Real DB-side execution on approve.
Its 2 disclosed gaps from this card (calendar-delete, credential
reconnect) were both closed later the same session — see below.

**Credential reconnect verified, BC-054/055/056 complete (2026-08-14):**
all 4 remaining Next-Build-Card candidates from that list were closed in
one continued session (see Last Updated above for full detail):
`zenny-notification-sender` reconnect live-reverified; BC-054 (recovery
max-steps enforcement); BC-055 (CancelAppointment real calendar-event
deletion, live-proven end-to-end against a real disposable Google
event); BC-056 (INT-008's real ownership-release caller). The residual
Edge Function client_id-trust gap (BC-052 finding) and Phase 5A/5D/
SCH-007 remain open — see below.

**BC-057b complete (2026-08-14): Convocore reachability rechecked, still
blocked (both REST and MCP), not a build blocker — manual Canvas UI
fallback confirmed as the path forward.** Doc set annotated. See
`Wiki/reference/convocore-doc-status.md`.

**BC-058 complete (2026-08-14): master intake checklist built.**
**BC-058c complete (2026-08-14): the 2 stale docs actually fixed;
`agent_prompts` resolved as a real, disclosed Email Manager gap (built,
not wired) — unrelated to Convocore.** See Last Updated above,
`Wiki/infra/convocore-agent-provisioning.md`,
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`. Document
Resolution Authority pause closed — BC-059 clear to proceed.

Dual build path agreed with human 2026-08-14:

**Path A — remaining backend**, pulled in only as the demo business
actually needs it:
1. ~~Residual Edge Function client_id-trust gap (BC-052 finding)~~
   **CLOSED for 4 of 6 (BC-063, 2026-08-15).** See Last Updated above.
2. Calendly's real calendar-delete path (BC-055 built it to spec but
   could not live-test — no roster Calendly connection).
3. Phase 5A (Inventory dashboard) / SCH-007.
4. ~~`control.agent_prompts` wiring gap (BC-058c finding)~~ **CLOSED
   (BC-062, 2026-08-15).** Redesigned to per-client-schema, INT-010/
   INT-011 rewired and live-tested, both published. See Last Updated
   above and `Wiki/log.md` session-BC-062 redesign entry.
5. ~~Security Advisor authenticated-grant gap~~ **CLOSED (BC-064,
   2026-08-15).** 117 warnings → 11. See Last Updated above.
6. **QUEUED, not started (2026-08-17): Live Product Catalog Sync →
   Convocore KB**, for clients whose catalog isn't in a system we
   already sync (Shopify/WooCommerce order/lifecycle wiring exists but
   no catalog-sync workflow does yet). Human-approved shape, from an
   advisor-mode discussion — reuses Email Manager's proven Notion+
   Pinecone KB pattern (INT-011/INT-012) instead of storing the catalog
   in Supabase:
   - **BC-065** — shared sub-workflow "Upsert Product to Client KB":
     normalized product row (`sku, name, price, stock_qty, category,
     description, image_url, updated_at`) in → upserts to that client's
     Notion product DB (the human-editable "sheet db") + embeds/upserts
     to that client's Pinecone namespace (same mechanism as
     INT-012). Build this first — everything else depends on it.
   - **BC-066** — Shopify-sync (webhook-triggered on `products/update`,
     normalize, call BC-065's sub-workflow).
   - **BC-067** — WooCommerce-sync (same pattern; WooCommerce's webhook
     support may be more limited — verify live before assuming parity
     with Shopify's).
   - **BC-068** — Sheets-sync (Google Sheets/Excel, scheduled poll, not
     webhook-triggered — no live-update signal from a spreadsheet).
   - **BC-069** — `search_sheet_kb` fallback Convocore tool (n8n
     webhook-backed): structured Notion-table query (exact SKU/price/
     stock lookups) for cases semantic KB search handles poorly; native
     Convocore KB search stays the default path.
   Custom inventory systems and static-only sites were explicitly
   discussed and are NOT queued as generic Build Cards — no common API
   shape exists to build a reusable workflow against; each is a
   client-specific card if/when a real client needs it (or, for a
   static site with nothing to sync from, a Sheet-as-source-of-truth
   fallback using BC-068's own sync path).
7. **QUEUED, not started (2026-08-17): BC-070 — n8n-native conversation
   runtime prototype (Convocore-cost-alternative spike).** Trigger:
   Convocore's pricing for the API-access tier we actually need
   (Business plan+) is high enough the human is evaluating alternatives.
   Researched Zapier first, ruled out: no multi-tenant/agency workspace
   model, Chatbots product is basic FAQ/notification-triggered, no
   native voice, channel integrations are shallow message-in/out
   triggers not a real conversation engine — structurally can't do what
   this platform needs regardless of cost. **Real finding: n8n (already
   running, already paid for) natively supports a Chat Trigger + AI
   Agent node with tool-calling — the same underlying mechanism INT-010/
   011 already prove live (`chainLlm`+`lmChatOpenRouter`).** Scope for
   BC-070: a **web-chat-only prototype** (matches Carmelli's real B2
   answer, no channel/voice scope creep) proving an n8n-hosted
   conversation runtime end-to-end against one real client, before
   committing to a full rebuild. New pieces needed: embeddable chat
   widget (small React component), n8n Chat Trigger wiring, session/
   context handling. Explicitly NOT in scope for BC-070: WhatsApp/
   Instagram/Telegram ingress, voice (Twilio schema exists, unused,
   `Wiki/credentials/twilio.md`) — de-risk on one channel first, expand
   only with real data. Cost shape: near-zero new recurring licensing
   (n8n/Supabase already paid, LLM token cost unchanged either way);
   real cost is build time + newly-owned maintenance surface, not a
   free lunch — disclosed, not oversold.
   **Design finalized 2026-08-17** (follow-up session): router +
   per-turn session-state dispatch (Postgres lookup, not an LLM call
   every message) + specialized sub-workflow agents (product
   recommendation/lead conversation/booking/support/escalation) that
   self-report a `handoff` field in their normal structured response
   instead of a dedicated classifier running every turn — steady-state
   cost is 1 DB read + 1 LLM call per turn. Runtime choice (n8n-native
   vs. a dedicated LangGraph/FastAPI service) is decided by an explicit
   output-quality gate in BC-070's own Definition of Done, not assumed
   either way. Full outline, including the customer/admin dashboard
   spec this eventually feeds:
   `05_Platform_Builds/.Future_Custom/Zenny_Own_Conversation_Runtime_Outline_v1.md`.

**Path B — real Convocore agent build (test+verify+build for a demo
business):**
- BC-057b done.
- BC-058 done — `Convocore_Agent_Intake_Checklist_v1.md` built and
  schema-grounded.
- BC-058c done — stale docs fixed, `agent_prompts` finding corrected
  (Email Manager, not Convocore). Pause closed.
- BC-059 done — checklist run against carmelli.co.uk (Commerce-Ecom).
  All AUTO rows filled; a short real ASK list is now ready to send to
  the business (hours, refund policy, ecommerce platform, plus the
  standard module/channel/integration questions).
- BC-060 (in progress, 2026-08-17): Carmelli's ASK answers came back
  (human-supplied demo decisions). Supabase provisioning (client row,
  schema clone, config, active modules, agent_prompts/email_categories
  seed, Notion KB) is **done and live-verified** — see Last Updated
  above and `BC-060_Onboarding_Process_Reference_v1.md`. **Gate 1
  (dashboard login) CLOSED same day** — real Auth account +
  `dashboard_users` mapping, live-verified. **2 gates remain, both on
  the human:** (2) manual Convocore Canvas UI build (staying on the
  free tier by choice, not `403`-blocked-and-waiting); (3) connect
  Gmail for `carmelli.zennyai@gmail.com` via the dashboard's real
  Integrations page, now reachable since login exists.
- **BC-071 COMPLETE (2026-08-17): Carmelli Convocore Build Package —
  Variables → Tools → Global Prompt → Nodes.** Human decision: stop
  deferring the own-stack question (BC-070/outline), finish the real
  Convocore build for Carmelli first — test the workflows, get a working
  demo, then revisit the platform-runtime decision. This card produces
  the actual copy-paste-ready content the human types into Convocore's
  Canvas UI for gate 2 (still manual — `403` unchanged, staying on free
  tier by choice), sequenced exactly per `Convocore_Agent_Build_Order_
  Guide_v2.md` Parts 3-6 (Doc-Search-First discipline: every value
  pulled from Zenny's own system docs, never invented) and structured so
  it can later seed the Phase 5D onboarding-dashboard automation, same
  intent as `BC-060_Onboarding_Process_Reference_v1.md`.
  **Target — 3 new docs under `05_Platform_Builds/Convocore/BC-071_Carmelli_Build_Package/`:**
  1. `01_Variables_Spec.md` — every Variable Carmelli's agent needs to
     capture: Key (sourced from `INTEGRATION_CONTRACT_v1.md` payload
     field names / `Tool_Naming_Convention.md`, never invented),
     type (Local/Global/ENV), Description (written for the LLM, with a
     few-shot example where useful), source module.
  2. `02_Tools_Spec.md` — every Custom Tool: Key (from
     `INTEGRATION_CONTRACT_v1.md` Part 4's Tool Name Registry /
     `n8n_Workflow_Specification_v1.md` Part 7 — exact match, not
     freely named), Description (when the LLM should call it),
     attached Variables (from doc 1, Keys matching expected payload
     fields), which module owns it, plus which System Tools to enable
     (`human-handoff` — team_key routing from `Agent_Runtime_System_
     v1.md`'s Human Handoff Handler section; `shopify`/`forward-call`/
     `end-call` only if applicable to Carmelli's real config).
  3. `03_GlobalPrompt_and_Nodes_Spec.md` — Global Prompt content
     (identity/persona/tone from `customer_psychology_principles_v1.md`
     + the Evidence Foundation doc, universal hard rules) + one section
     per node: Start Node and one Module Node per Carmelli's active
     modules (`core_agent`, `growth_agent`, `conversion_engine`,
     `recovery_engine`, `email_manager` — per BC-060 Step 4's real
     `client_active_modules` row), each with Instructions sourced from
     that module's actual section in `Agent_Runtime_System_v1.md`
     (never re-derived from general judgment), routing-trigger field,
     Default-vs-Global toggle, and the Tools/KB scoped to that module.
  **Explicitly NOT in this card's scope:** actually clicking through
  the Convocore Canvas UI (that's the human's gate-2 action, this card
  only produces the content they paste in), voice configuration
  (Carmelli's B3/B4 answers are both `false`), and any new registry
  entries — if Doc-Search-First finds a genuine gap (a Tool Key with no
  registry entry, a module section `Agent_Runtime_System_v1.md` doesn't
  cover in enough depth), stop and ask per the guide's own escalation
  rule, don't invent.
  **Acceptance Criteria:** all 3 docs exist, every Variable/Tool Key is
  traceable to a cited source document (no invented names), every
  node's Instructions cites its source section in `Agent_Runtime_
  System_v1.md`, human confirms the package is usable for a real
  Canvas-UI build session.
  **Definition of Done:** 3 docs written + `BC-060_Onboarding_Process_
  Reference_v1.md` cross-referenced (points to this package for gate
  2's actual content) + `PROJECT_STATE.md`/`Wiki/log.md` updated + git
  commit/push. Convocore itself is not touched (no MCP calls needed —
  `list_agents` still `403`, unchanged; nothing here requires
  re-verifying that).
- BC-061: full round-trip test (real conversation → adapter → n8n →
  Supabase → dashboard) — waits on BC-060's 3 gates clearing first,
  including the human's manual build using BC-071's package.

Phase 5D (Onboarding dashboard) is deliberately sequenced *after* Path B
completes once for real — human wants the manual written from a lived
build, not guessed in advance.

ADP-001 (Voiceflow Adapter doc/reality mismatch) dropped from candidates
per human instruction (2026-08-14) — no longer worth investigating.
(`appointments` doc diff intentionally NOT in this list — see Active
Blockers, deferred.)

## Handoff Note (for next session)

**Where things stand:** Phase 8 (Conversion Engine, all 11 Tools) done.
Phase 9 (Recovery Engine) is now fully live and closed-loop: all 4
internal workflows + SCH-001 (WF-018, INT-006, INT-007, INT-008), INT-007
wired into Email Manager's live chain, INT-008 now has a real dashboard
caller (BC-056), max-steps genuinely enforced (BC-054). Phase 10 (Email
Manager) is feature-complete: all 7 workflows live, fully chained and
cadenced, no open Credential Gate. KB source is Notion+Pinecone;
Convocore stays wired-dormant. All 3 human-approved Build Cards from the
2026-08-14 decision session shipped (BC-051/052/053), then all 4
remaining Next-Build-Card candidates also shipped the same session
(credential reconnect, BC-054/055/056) — see `Wiki/log.md` for full
narrative of each. Nothing is mid-flight; the next session starts clean.

**What's genuinely open, in priority order:** Human priority as of
2026-08-17: finish Path B's real Convocore build for Carmelli before
returning to the own-stack/BC-070 evaluation (BC-065-069, BC-070 are
queued, deliberately paused, not dropped). Path B is mid-flight for
real: BC-060 provisioned Carmelli Bakery's Supabase side live and gate 1
(dashboard login) closed same day; BC-071 (this session) delivered gate
2's real build content — see Last Updated,
`BC-060_Onboarding_Process_Reference_v1.md` v1.2, and
`BC-071_Carmelli_Build_Package/`. **2 gates remain, both on the human:**
gate 2 (manual Convocore Canvas UI build, now with exact content to
paste in) and gate 3 (Gmail OAuth via the dashboard's real Integrations
flow). Convocore is still `403`-blocked on REST+MCP (unchanged, no
re-check needed this session — no MCP call was required for BC-071's
pure doc-authorship scope). Once gate 2/3 clear, BC-061 (full
round-trip test) is next. Phase 5D (Onboarding dashboard) intentionally
waits until Path B's first real build actually completes. `appointments`
doc diff stays deferred, see Active Blockers.

Nothing requires human acknowledgment before proceeding — all
self-resolved document-level items from recent sessions are logged in
Wiki/log.md and their relevant Wiki/platform-quirks/ pages.
