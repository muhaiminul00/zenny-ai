# PROJECT_STATE.md — Current State Dashboard

Purpose: what's true RIGHT NOW. Not history (see Wiki/log.md), not
durable facts/decisions (see Wiki/*.md). Overwritten each session,
never appended to.

Read this first, every session. Then Wiki/index.md for anything this
file points to but doesn't explain.

---

## Last Updated
2026-08-29 (latest) — by /execute — **gstack-integration Phase 2
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
