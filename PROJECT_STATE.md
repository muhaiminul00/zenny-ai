# PROJECT_STATE.md — Live Build State

```
Purpose:   Real, current ground truth of what's actually built, tested,
           and blocked — updated by Claude Code at the end of every
           session. This is NOT a plan (that's Planning_to_Build_
           Transition_v1.md) — it's a status snapshot. The Commander
           reads this before issuing every new Build Card.
Rule:      Overwrite the status sections below each session. NEVER
           delete the Session Log — it's append-only, oldest at bottom.
Location:  Project root. Committed to git (zenny-sync) after every
           Claude Code session, alongside whatever code/schema changed.
```

---

## Last Updated
2026-08-05 — by Claude Code, Session 4 (BC-003 complete except 3 flagged items)

## Current Phase
Phase 1 — Close Credential Platform Gaps — Steps 0-6 of BC-003 all acted
on. 4 of 6 oauth_apps providers fully seeded with real credentials
(Google, Shopify, Calendly, Slack — Slack with a flagged schema
mismatch). Cal.com and one auth.users cleanup blocked on real gaps, not
guessed around — see Blockers. WooCommerce confirmed correct as-is.

---

## Phase Checklist (mirrors Planning_to_Build_Transition_v1.md Part 4)

```
Phase 0  — Environment Setup .................... IN PROGRESS
Phase 1  — Close Credential Platform Gaps ........ NOT STARTED
Phase 2  — Convocore Database Changes ............ NOT STARTED
Phase 3  — Remaining Shared Utilities ............ NOT STARTED
Phase 4  — Convocore Adapter (ADP-002) ........... NOT STARTED
Phase 5  — 4 New Dashboard Systems (Directus) .... NOT STARTED
Phase 6  — Core Agent ............................ NOT STARTED
Phase 7  — Growth Agent .......................... NOT STARTED
Phase 8  — Conversion Engine (11 Tools) .......... NOT STARTED
Phase 9  — Recovery Engine ....................... NOT STARTED
Phase 10 — Email Manager ......................... NOT STARTED
Phase 11 — Scheduled Workflows ................... NOT STARTED
Phase 12 — Node-by-Node Outlines ................. NOT STARTED (cross-cutting)
Phase 13 — Template Dashboard .................... DEFERRED (per Part 2.6)
```

---

## Database — Real Current State (BC-003 live audit, project zenny-vault ONLY)

```
control.oauth_apps:              EXISTS, MATCHES SPEC (Part 4.2). 7-value
                                  provider CHECK (google, calendly,
                                  cal_com, shopify, slack, gmail,
                                  woocommerce) — a reasonable, spec-
                                  consistent extension, not a violation.
                                  6 rows, all PLACEHOLDER values
                                  (client_id = "PENDING_<PROVIDER>_
                                  CLIENT_ID" or "NOT_APPLICABLE"; each
                                  row's client_secret_id points to a
                                  real Vault UUID — decrypted contents
                                  NOT read directly, per the harness's
                                  own classifier blocking that action;
                                  assumed placeholder text given the
                                  client_id pattern, not confirmed).
                                  app_status: 5 rows 'testing', 1 row
                                  ('woocommerce') 'not_applicable'. No
                                  cal_com row exists as 'pending' yet —
                                  BC-003 Step 6 sets this.
control.client_connections:      EXISTS, MATCHES SPEC (Part 4.2) +1
                                  reasonable extension: secondary_secret_id
                                  (nullable uuid, documented in-column
                                  comment — holds a second simultaneous
                                  credential part, e.g. WooCommerce
                                  Consumer Secret). UNIQUE(client_id,
                                  category) constraint confirmed present.
                                  last_error: plain text, nullable —
                                  matches Part 5.3/2.9's resolved
                                  decision exactly. 0 rows (expected,
                                  no live client yet).
control.oauth_state:             EXISTS, MATCHES SPEC (Part 4.2) exactly.
                                  0 rows (expected).
control.connection_audit_log:    EXISTS, MATCHES SPEC (Part 6.3) exactly,
                                  including reason as plain text nullable
                                  (no structured category — confirmed
                                  decision, Part 2.9). 0 rows (expected).
control.convocore_agent_map:     NOT YET BUILT (Phase 2, out of scope)
leads (Convocore columns):       NOT YET ADDED (Phase 2, out of scope)
escalations.escalation_team:     NOT YET ADDED (Phase 2, out of scope)

RPC layer (Part 4.4 SECURITY DEFINER pattern) — ALREADY BUILT, confirmed
live: store_credential_secret(value,name,description)->uuid,
read_credential_secret(secret_id)->text, get_oauth_app, upsert_client_
connection, insert_audit_log_event, update_connection_tokens,
update_connection_status, get_client_connection, get_connections_due_
for_refresh, get_google_testing_connections_near_7day_expiry,
insert_oauth_state, consume_oauth_state — all SECURITY DEFINER, all
found via live pg_proc query, none assumed.

Edge Functions (project zenny-vault) — ALL 3 CONFIRMED DEPLOYED + ACTIVE,
real (non-stub) implementations read in full:
  oauth-initiate       ACTIVE, v2 — builds provider authorize URLs for
                        google/shopify/slack/calendly/cal_com via
                        get_oauth_app+insert_oauth_state RPCs
  oauth-callback        ACTIVE, v2 — live-tested with a bare GET (no
                        state param): returned real 302 redirect to
                        https://dashboard.zenny.pending/?connect_result=
                        error&reason=missing_state, exactly matching its
                        own source logic. Note: ZENNY_DASHBOARD_URL env
                        var appears unset (using the ".pending" fallback
                        default) — informational, not blocking.
  woocommerce-connect    ACTIVE, v1 — validates Consumer Key/Secret via
                        a live GET against the client's own store's
                        /wp-json/wc/v3/system_status before storing
                        anything; stores Key in access_token_secret_id,
                        Secret in secondary_secret_id, refresh_token_
                        secret_id NULL (correctly derives as api_key
                        per Part 4.2.1).
```

## Workflows — Real Current State

```
UTIL-001 Schema Resolver:         NOT STARTED
UTIL-002 Data Validator:          NOT STARTED
UTIL-003 Error Logger:            NOT STARTED
UTIL-004 Notification Router:     NOT STARTED
UTIL-005 Stop Checker:            NOT STARTED
UTIL-006 Credential Resolver:     BUILT — tested w/ placeholder creds
SCH-006 Token Refresh Sweep:      BUILT, interval CONFIRMED LIVE = exactly
                                  6 hours (n8n get_workflow_details:
                                  "Every 6 Hours" node, rule.interval =
                                  [{field:"hours", hoursInterval:6}]) —
                                  matches Part 2.9's decision exactly, no
                                  correction needed. Workflow is
                                  active:false in n8n (built, not yet
                                  turned on) — reasonable given no real
                                  credentials exist yet to refresh.
[... add every WF/SCH/INT/ADP as it's touched, never remove a line]
```

## Credentials — Real Current State

```
Google:     SEEDED, real. client_id = real Google Cloud OAuth client ID
            (matches Zenny_production_credential(...).txt exactly, an
            *.apps.googleusercontent.com identifier — client IDs are not
            secrets per Google's own model, unlike client_secret),
            client_secret_id -> Vault UUID cc67675c-3813-48b3-9e13-
            c22e18e00da9. app_status still 'testing' (per prior session —
            verification submitted, pending Google's review).
Shopify:    SEEDED, real. client_id = real Shopify Dev Client ID,
            client_secret_id -> Vault UUID 02957b66-82f0-49d1-898d-
            de532d8bc4ab. app_status 'testing'.
Slack:      SEEDED, real, WITH A FLAGGED SCHEMA MISMATCH — what was
            captured is a bot user OAuth token (xoxb-...), not an OAuth
            app client_id+secret pair (which is what oauth_apps' schema
            structurally expects for the "Add to Slack" multi-tenant
            flow, Part 8.4). client_id set to the literal string
            'SLACK_BOT_TOKEN_MODE_NO_OAUTH_APP' (honest placeholder, not
            a fabricated OAuth client ID) rather than force-fitting a
            fake value. client_secret_id -> Vault UUID 8e8c4638-85b0-
            40e4-b02b-a69798b3acfb (holds the real bot token).
            **Needs a Commander decision:** either a real Slack OAuth
            app gets registered later (then this row gets properly
            reseeded), or the schema/architecture doc gets amended to
            document bot-token mode as a real, intentional pattern for
            single-workspace Slack setups.
Calendly:   SEEDED, real. client_id = real Calendly OAuth Client ID,
            client_secret_id -> Vault UUID 6060ef36-e48a-44dc-bb87-
            c9564afbd7be. app_status 'testing'. Webhook signing key
            ALSO stored in Vault (UUID 44e988d4-403b-48ce-b15e-
            5c7f9edfefd0, name calendly_webhook_signing_key) but **NOT
            referenced anywhere in oauth_apps — no column exists for
            it.** Genuine schema gap, not invented around — flagged for
            Commander (likely needs a new
            oauth_apps.webhook_signing_key_id uuid column, or an
            equivalent, via Template_Migration_Process.md).
Cal.com:    NOT seeded — blocked, not guessed around. Planning_to_Build_
            Transition_v1.md Part 2.9 says set app_status='pending'; the
            LIVE chk_oauth_apps_status CHECK constraint only allows
            ('testing','published','not_applicable') — 'pending' is
            REJECTED by the live database. Attempted the UPDATE, got a
            real constraint-violation error, did not alter the
            constraint unilaterally. Row unchanged: still app_status=
            'testing', client_id='PENDING_CALCOM_CLIENT_ID', old
            placeholder secret untouched. **Needs Commander decision:**
            migrate the CHECK constraint to add 'pending', or use a
            different already-valid value as the "don't route real
            traffic yet" signal.
WooCommerce: row exists, app_status = 'not_applicable', matches Part 8.3
            fallback pattern (no OAuth registration needed) — CONFIRMED
            correct as-is, nothing to seed, nothing changed.
control.oauth_apps seeded:        4 of 6 providers now hold real
                                   Vault-backed credentials (Google,
                                   Shopify, Slack, Calendly — Slack
                                   flagged above). Cal.com blocked on a
                                   real constraint mismatch. WooCommerce
                                   correctly needs nothing. The 4 old
                                   placeholder Vault secrets (google/
                                   shopify/slack/calendly) are now
                                   orphaned/unreferenced but NOT deleted —
                                   a cleanup DELETE was attempted and
                                   blocked by the harness's own
                                   permission classifier, not worked
                                   around. Harmless (unreferenced), just
                                   untidy — safe to leave or clean up
                                   later.
Vault storage round-trip:         CONFIRMED LIVE this session — wrote a
                                   disposable test secret via
                                   store_credential_secret(), read it back
                                   via read_credential_secret(), exact
                                   match confirmed, then deleted the test
                                   secret via DELETE FROM vault.secrets.
Redirect URI:                     kmhzosyljpzheqvfuyzm.supabase.co/
                                   functions/v1/oauth-callback — RE-
                                   CONFIRMED live this session (real 302
                                   response, not just DB-row text match).
```

## MCP Configuration — Real Current State (BC-002)

```
Supabase MCP:  CONFIGURED, LIVE-VERIFIED. list_projects returned 2 real
               projects — "zenny-vault" (id kmhzosyljpzheqvfuyzm,
               ap-northeast-2, ACTIVE_HEALTHY, the documented/correct
               project) and "zenny-dashboard" (id bzckrqgasqiglsgqyzft,
               ap-south-1, ACTIVE_HEALTHY — undocumented second project,
               likely the teammate's earlier standalone reference build;
               not investigated further, flagged below). Followed up
               with list_tables(project_id=kmhzosyljpzheqvfuyzm,
               schemas=[control]) — returned all 9 documented control
               tables correctly, PLUS 4 tables PROJECT_STATE.md had
               marked "NOT YET BUILT": control.oauth_apps (6 rows),
               control.client_connections (0), control.oauth_state (0),
               control.connection_audit_log (0). See correction below.
n8n MCP:       CONFIGURED, LIVE-VERIFIED. search_workflows (no filter)
               returned 38 real workflows, including several already
               matching this project's naming scheme (WF-001 LEAD
               CREATION ENGINE, WF-002 CONVERSION ENGINE, WF-003
               ESCALATION ENGINE, WF-501 Error Logger, WF-503 Data
               Validator, the 6 WF-2xx Email Manager v1 drafts, and 4
               "Zenny Credential Platform" workflows including UTIL-006
               Credential Resolver and SCH-006 Token Refresh Sweep —
               consistent with this file's existing "BUILT" entries
               below). n8n instance/workflow inventory is real and
               substantially ahead of what a from-scratch Phase 0 would
               assume.
```

**CORRECTION to this file's prior "Database — Real Current State" section
(above), discovered only as a byproduct of BC-002's live-verification
call, not investigated further — that's BC-003 scope:** `control.
oauth_apps`, `control.client_connections`, `control.oauth_state`, and
`control.connection_audit_log` already exist in zenny-vault (previously
marked "NOT YET BUILT" above, now corrected to "EXISTS" pending BC-003's
proper inspection of row contents/schema-shape correctness). Do not trust
the un-struck lines above as current until BC-003 re-verifies each one
directly.

## Blockers Right Now

```
- RESOLVED (BC-003 Step 6): human directed Claude Code to
  Zenny_production_credential(claude_code_can_use).txt as the intended
  secure channel. Google, Shopify, Calendly seeded cleanly. Slack seeded
  with a flagged schema-shape mismatch (bot token vs. expected OAuth
  client_id+secret — see Credentials section). Calendly's webhook signing
  key stored in Vault but orphaned (no oauth_apps column exists for it —
  flagged, not invented around). Cal.com BLOCKED — live CHECK constraint
  chk_oauth_apps_status rejects 'pending', the value Part 2.9 explicitly
  calls for; not altered unilaterally, needs a Commander decision
  (migrate the constraint, or use a different valid value). WooCommerce
  confirmed correct, untouched. 4 old placeholder Vault secrets are now
  orphaned (harmless) — a cleanup DELETE was blocked by the harness's own
  classifier, not worked around.
- ACTION BLOCKED BY HARNESS (BC-003 Step 1): auth.users has exactly 2
  rows. Checked auth.identities for both — both show provider:'email',
  confirming both were created via this project's OWN Supabase Auth
  signup flow (application-level), not by Supabase's separate platform/
  account system (which never populates a project's own auth.users
  table). Human confirmed (in-session): both are test rows, delete both.
  No FK references exist from any control.* table to auth.users (checked
  live, zero results). Attempted `DELETE FROM auth.users WHERE id IN
  (...)` for both rows — blocked by the Claude Code harness's own
  permission classifier (separate from human chat approval). NOT worked
  around. Still 2 rows in auth.users as of this write-up:
  402c36e1-0688-4bbd-b008-881b1499867b (teyoyo8820@rapplo.com) and
  bb43c8f0-81ab-4378-a425-bba97b1ab193 (zeromanualtech@gmail.com).
  Needs either: human runs the DELETE directly, or grants Bash/tool
  permission for this specific action so Claude Code can retry.
- Two Supabase projects exist under this org (zenny-vault AND an
  undocumented zenny-dashboard) — every future MCP call in this project
  MUST explicitly target project_id kmhzosyljpzheqvfuyzm (zenny-vault).
  Confirmed again this session — every BC-003 query targeted zenny-vault
  explicitly, zenny-dashboard was never touched.
```

## Deviations From Build Card / Open Questions for Commander

```
1. No .gitignore existed at repo root — .mcp.json (plaintext
   WORKSPACE_SECRET), its docker-backup copy, and a credential .txt file
   were all unprotected from an accidental `git add .` commit. Added a
   .gitignore covering these plus common OS cruft. Flagging since this
   is a real security gap that predates this session, not something the
   Transition doc anticipated needing a fix.
2. `.claude/skills/supabase` and `.claude/skills/supabase-postgres-best-
   practices` were dangling symlinks pointing at the pre-rename project
   path (`/e/Programming/Zeny Ai - Voiceflow/...`) — the folder was
   renamed to `Zenny - breakthrough` at some point and the symlinks were
   never updated, so these skills were silently not loading. Repointed
   both symlinks to the correct current path (same target content,
   `.agents/skills/*`, untouched). Purely a path fix, no content change.
3. "Database Architecture Review & Future Runtime Roadmap v1.md" (root,
   dated 2026-07-18) was NOT archived — genuinely unsure whether its
   "Future Runtime Roadmap" content is still live or fully superseded by
   Database_Structure_v4_FINAL.md + the Convocore FINAL docs. Flagging
   per your instruction to leave-and-flag rather than guess.
4. "AI_Workforce_Implementation_Operating_Manual_v2.md" was archived
   alongside AI_Builder_Operating_Manual_v1.md even though Claude_Build_
   Command_Protocol_v2.md's Status line only names the latter as
   superseded. Its content describes the old three-party Claude Code +
   Codex model, which Protocol v2 explicitly retires ("Codex is no
   longer part of this pipeline") — judged clearly superseded by
   content, not just by an exact filename match. Flagging the reasoning
   since it wasn't a literal 1:1 per the stated rule.
5. "Zenny_production_credential(claude_code_can_use).txt" was left in
   place, untouched, not evaluated for content — file organization scope
   was documents, not credential material, and this file is exactly the
   kind of thing this session should surface rather than silently move
   or open. Now covered by .gitignore going forward regardless.
```

---

## Session Log (append-only — newest at top, never delete old entries)

### Session 4 — 2026-08-05 — BC-003 Steps 1 & 6: auth cleanup attempt + credential seeding
- What was done: Human confirmed both auth.users rows were test data
  (verified via auth.identities: both provider:'email', i.e. created
  through this project's own Auth signup flow, not Supabase's platform
  account system) and directed deletion of both. Attempted the DELETE —
  blocked by the Claude Code harness's own permission classifier
  (destructive auth-schema write), not worked around; both rows remain.
  Human then directed Claude Code to
  Zenny_production_credential(claude_code_can_use).txt as the intended
  channel for BC-003 Step 6. Seeded 4 of 6 oauth_apps providers with real
  Vault-backed credentials via store_credential_secret + UPDATE (never
  INSERT, per the card): Google, Shopify, Calendly cleanly; Slack with a
  flagged schema-shape mismatch (bot token captured, not an OAuth
  client_id+secret pair — client_id set to an honest literal marker, not
  a fabricated value). Calendly's webhook signing key stored in Vault but
  has no oauth_apps column to reference — flagged, not invented around.
  Cal.com blocked: live app_status CHECK constraint rejects 'pending'
  (the value Part 2.9 explicitly calls for) — not altered unilaterally.
  WooCommerce confirmed correct, untouched. Attempted cleanup DELETE of 4
  now-orphaned placeholder Vault secrets — also blocked by the harness
  classifier, not worked around (harmless, just untidy).
- What was verified live vs. assumed: Every UPDATE's real post-write row
  state was pulled via RETURNING and confirmed against what was intended
  — no assumption that a write succeeded without seeing its result.
  Cal.com's constraint rejection is a real captured Postgres error, not
  inferred. Two harness permission blocks are exactly what they say —
  reported verbatim, no retry/workaround attempted for either.
- What broke / changed from plan: 3 items in this card could not be
  fully closed even with human credential/decision input: auth.users
  cleanup (harness-blocked), Cal.com's app_status (schema constraint
  mismatch, needs a real migration decision), Calendly's webhook signing
  key (no schema home exists yet). All three are genuine stops, not
  scope creep or a missed step — flagged for the Commander.
- Files touched: PROJECT_STATE.md only. Database writes: control.
  oauth_apps rows for google/shopify/slack/calendly updated (not
  inserted); 5 new real Vault secrets created (4 provider credentials +
  1 orphaned webhook signing key); no rows deleted anywhere this session
  (both delete attempts were harness-blocked).

---

### Session 3 — 2026-08-05 — BC-003: Credential Platform Gaps (partial)
- What was done: Step 0 — full live audit of all 4 credential-platform
  tables (columns, constraints, RLS, real row contents of oauth_apps)
  against Client_Integration_and_Credential_Platform_v1.md and
  Database_Structure_v4_FINAL.md before any write. All 4 tables:
  MATCHES SPEC (2 with reasonable, documented additive extensions —
  client_connections.secondary_secret_id, oauth_apps' 7-value provider
  CHECK). Discovered the full SECURITY DEFINER RPC layer (Part 4.4) and
  all 3 Edge Functions (Part 5) already exist and are real, deployed
  implementations, not stubs — read every one in full. Step 2 — live
  Vault round-trip test (store_credential_secret -> read_credential_
  secret -> match -> cleanup), confirmed working, test secret deleted.
  Step 3 — redirect URI re-confirmed via a real HTTP call (302 response
  matching source code exactly), all 3 Edge Functions confirmed ACTIVE.
  Step 4 — SCH-006's live n8n interval confirmed = exactly 6 hours, no
  correction needed. Step 5 — last_error/reason confirmed plain text,
  nullable, no structured category, matching the already-resolved
  decision. Step 1 and Step 6 both stopped short of action — see
  Blockers — per the card's own explicit "flag and wait" / credential
  gate instructions, not silently resolved either way.
- What was verified live vs. assumed: Everything in this session's
  Database/Workflows/Credentials sections above is live-verified (real
  SQL query output, real n8n workflow JSON, real HTTP response, real
  Edge Function source code) — nothing in this update is assumed. The
  one deliberate non-verification: existing oauth_apps rows' decrypted
  client_secret_id values were NOT read (the harness's own permission
  classifier blocked a direct vault.decrypted_secrets query) — classified
  as "assumed placeholder" based on the client_id column's own PENDING_*
  pattern, not confirmed by reading the secret itself, and explicitly
  labeled as an assumption in the Database section above.
- What broke / changed from plan: Two of BC-003's six steps could not be
  completed in this session without further human input (Step 1's
  ambiguous auth row, Step 6's credential gate) — both are genuine stops
  required by the card's own text, not scope creep or a missed step.
- Files touched: PROJECT_STATE.md only. One disposable Vault test secret
  was created and deleted (control.oauth_apps and all 4 credential-
  platform tables' real rows were read but not written to).

---

### Session 2 — 2026-08-05 — BC-002: MCP Configuration
- What was done: Confirmed Supabase MCP (claude_ai_Supabase) and n8n MCP
  (claude_ai_n8n) are now present and callable (human configured them
  outside this session, per the credential gate — no config file edited
  by Claude Code, .mcp.json's Convocore entry untouched). Live-tested
  each with a real read-only call: `list_projects` + `list_tables`
  (control schema, zenny-vault) on Supabase; `search_workflows` on n8n.
  Real output pasted into the Implementation Report. Updated this file's
  Blockers, added an "MCP Configuration" status section, and corrected
  the Database status section based on what list_tables actually showed.
- What was verified live vs. assumed: Both connections verified with
  real tool calls, not just "the tool now appears in ToolSearch."
  Discovered live (not assumed): a second, undocumented Supabase project
  "zenny-dashboard" exists in the same org — every future call must
  target zenny-vault (kmhzosyljpzheqvfuyzm) explicitly. Also discovered
  live: control.oauth_apps/client_connections/oauth_state/
  connection_audit_log already exist in zenny-vault, contradicting this
  file's prior "NOT YET BUILT" entries — not investigated further, out
  of BC-002's explicit scope (BC-003).
- What broke / changed from plan: Nothing broke. BC-002 scope only —
  no schema/workflow work performed, per the card's explicit exclusion.
- Files touched: PROJECT_STATE.md only (this session).

---

### Session 1 — 2026-08-05 — Phase 0: Environment Setup
- What was done: Read all 6 required documents in full (Protocol v2,
  Transition doc, Workflow Spec, Database Structure v4 FINAL +
  current_state.sql, Client Integration & Credential Platform v1,
  External Integration Strategy v1, all 3 Convocore FINAL docs).
  Archived 5 confirmed-superseded root documents into
  `_archive_planning_phase/`. Rewrote CLAUDE.md for the build phase
  (project summary, Commander/Executor model, MCP-verification and
  credential-testing standing rules, PROJECT_STATE.md protocol block).
  Added root `.gitignore` to stop secrets from being committed. Fixed
  two dangling `.claude/skills/` symlinks left over from a project
  folder rename. Updated this file's status sections and added the
  Phase 0-13 checklist mirroring Transition doc Part 4.
- What was verified live vs. assumed: Confirmed via direct filesystem
  inspection (not assumed) that neither Supabase MCP nor n8n MCP is
  configured anywhere in this environment — searched `.mcp.json`,
  `.vscode/mcp.json`, `~/.claude.json` (global config, both its
  top-level mcpServers-style entries and this project's own per-project
  registry), and via ToolSearch for any deferred supabase/n8n tool.
  None exist; only Convocore MCP is present and working. This directly
  contradicts the session prompt's framing ("confirm Supabase MCP and
  n8n MCP access are both configured and actually working") — they are
  not configured at all, not just unconfirmed.
- What broke / changed from plan: Phase 0 cannot be marked fully
  complete — MCP setup requires credentials only the human can provide
  (see Blockers). Everything else in Phase 0's scope is done.
- Files touched: CLAUDE.md (rewritten), .gitignore (new), PROJECT_STATE.md
  (this file), .claude/skills/supabase + supabase-postgres-best-practices
  (symlinks repointed), 5 files moved into _archive_planning_phase/.

---
