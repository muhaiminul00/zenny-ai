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
2026-08-05 — by Claude Code, Session 5 (BC-004 — Phase 1 COMPLETE)

## Current Phase
Phase 1 — Close Credential Platform Gaps — **COMPLETE.** All BC-004
items closed: Cal.com's status constraint migrated and set to 'pending',
Calendly's webhook signing key given a real schema home, auth.users
confirmed at 0 rows, 4 orphaned Vault secrets confirmed deleted, Slack's
real-OAuth-app gap logged as a non-blocking follow-up (see Blockers).
Phase 2 (Convocore Database Changes) is next, not yet started.

---

## Phase Checklist (mirrors Planning_to_Build_Transition_v1.md Part 4)

```
Phase 0  — Environment Setup .................... IN PROGRESS
Phase 1  — Close Credential Platform Gaps ........ COMPLETE
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
control.oauth_apps:              EXISTS, MATCHES SPEC (Part 4.2), NOW
                                  FULLY CURRENT as of BC-004. 7-value
                                  provider CHECK unchanged (google,
                                  calendly, cal_com, shopify, slack,
                                  gmail, woocommerce). app_status CHECK
                                  migrated (023) to 4 values: testing,
                                  published, not_applicable, pending.
                                  New column (024): webhook_signing_key_id
                                  uuid, nullable. 6 rows: google/shopify/
                                  calendly SEEDED real (app_status
                                  'testing'); slack SEEDED real with a
                                  confirmed schema-shape mismatch
                                  (bot token, not OAuth client_id+secret
                                  — non-blocking follow-up logged below);
                                  cal_com app_status now 'pending',
                                  client_id/secret still placeholder (no
                                  real Cal.com credential exists yet —
                                  correct); woocommerce 'not_applicable'
                                  (correct, untouched). See Credentials
                                  section below for full per-provider
                                  detail and exact Vault UUIDs.
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
Slack:      SEEDED, real, WITH A CONFIRMED (not just flagged) SCHEMA
            MISMATCH — BC-004 Step C confirmed: captured bot token is
            NOT a substitute for a real Slack OAuth app in this
            multi-tenant model (Part 8.4 assumes a shared "Add to Slack"
            app). Row left EXACTLY as committed in BC-003, no change
            this session — client_id = literal
            'SLACK_BOT_TOKEN_MODE_NO_OAUTH_APP', client_secret_id ->
            Vault UUID 8e8c4638-85b0-40e4-b02b-a69798b3acfb (real bot
            token). Confirmed NON-BLOCKING for Phase 1 closure — logged
            as a follow-up (see Blockers) for whenever Slack notification
            is actually built (Phase 3/UTIL-004 or later).
Calendly:   SEEDED, real, FULLY WIRED (BC-004 Step D). client_id = real
            Calendly OAuth Client ID, client_secret_id -> Vault UUID
            6060ef36-e48a-44dc-bb87-c9564afbd7be. app_status 'testing'.
            Webhook signing key now has a real schema home: migration
            024_add_webhook_signing_key_id_to_oauth_apps.sql added
            oauth_apps.webhook_signing_key_id (uuid, nullable, same
            non-FK Vault-reference pattern as client_secret_id) and the
            row was updated to reference Vault UUID 44e988d4-403b-48ce-
            b15e-5c7f9edfefd0 — confirmed via RETURNING. get_advisors
            (security) run after: no new issue introduced, only the
            pre-existing documented "RLS enabled, no policies" posture
            (Database_Structure_v4_FINAL.md §9, service_role bypasses
            RLS by design). **Doc diff still owed by Commander:**
            Client_Integration_and_Credential_Platform_v1.md Part 4.2's
            oauth_apps schema block needs webhook_signing_key_id added
            to its column list — Claude Code does not edit that document.
Cal.com:    RESOLVED (BC-004 Step B). Corrected understanding from BC-003:
            'pending' was always the deliberate, confirmed decision
            (Planning_to_Build_Transition_v1.md Part 2.9 / Part 6 item 2)
            — the live chk_oauth_apps_status CHECK constraint was the
            stale artifact, never updated to match that decision, not
            the other way around. Migration
            023_add_pending_to_oauth_apps_status.sql applied (additive
            only — dropped and re-added the constraint with 'pending'
            appended, no existing valid value removed; exact prior
            definition verified live via pg_get_constraintdef before
            writing the ALTER). app_status now 'pending', confirmed via
            RETURNING. client_id left as 'PENDING_CALCOM_CLIENT_ID'
            placeholder — correct, no real Cal.com credential exists yet
            (business email still pending). get_advisors run after: same
            result as Calendly above, nothing new. **Doc diff still owed
            by Commander:** Client_Integration_and_Credential_Platform_
            v1.md Part 4.2's app_status column comment needs 'pending'
            added to its documented value list.
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
NONE blocking Phase 1 closure. Phase 1 is COMPLETE as of BC-004.

Open, non-blocking follow-up (BC-004 Step C):
- Slack needs a real OAuth app (client_id+secret, chat:write scope only
  per External_Integration_Strategy_v1.md Part 6.2) registered before
  multi-tenant Slack notification is viable — the bot token captured is
  a single-workspace credential, wired into oauth_apps as an honest
  placeholder (client_id='SLACK_BOT_TOKEN_MODE_NO_OAUTH_APP'), not a
  real multi-tenant credential. Not blocking Phase 1 closure; blocks
  whenever Slack notification is actually built (Phase 3/UTIL-004 or
  later).

Standing discipline note (not a blocker, carried forward):
- Two Supabase projects exist under this org (zenny-vault AND an
  undocumented zenny-dashboard, per an earlier reference build) — every
  future MCP call in this project MUST explicitly target project_id
  kmhzosyljpzheqvfuyzm (zenny-vault). Human confirmed directly (BC-004
  context) that zenny-vault is canonical and zenny-dashboard belongs to
  a different, earlier build — not re-investigating further. Every
  BC-002/BC-003/BC-004 query targeted zenny-vault explicitly.

Resolved this session (BC-004), no longer open:
- Cal.com's app_status constraint — migrated (023), set to 'pending'.
- Calendly's webhook signing key — real column added (024), wired.
- auth.users — confirmed live at 0 rows.
- 4 orphaned placeholder Vault secrets — confirmed live at 0 remaining.

2 doc-diffs still owed by the Commander (not Claude Code's job per this
card's own instruction — flagged, not applied):
- Client_Integration_and_Credential_Platform_v1.md Part 4.2's app_status
  column comment: add 'pending' to the documented value list.
- Same document, same Part, oauth_apps schema block: add
  webhook_signing_key_id to the column list.
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

### Session 6 — 2026-08-05 — BC-006: doc sync (owed from BC-004)
- Applied both flagged doc diffs to Client_Integration_and_Credential_
  Platform_v1.md Part 4.2's oauth_apps schema block: added
  webhook_signing_key_id (uuid NULL) to the column list, and added
  'pending' to app_status's documented value list — both now match the
  live schema (migrations 023/024). No other content changed.

### Session 5 — 2026-08-05 — BC-004: Phase 1 closure
- What was done: Step A — re-verified auth.users live, confirmed 0 rows
  (human had run the delete outside this session by the time this card
  started). Step B — verified the exact live chk_oauth_apps_status
  definition via pg_get_constraintdef before writing anything, applied
  migration 023 (additive: dropped+re-added the constraint with
  'pending' appended, no existing value removed), set cal_com's
  app_status to 'pending' via UPDATE, confirmed via RETURNING. Step C —
  confirmed Slack's bot-token-vs-OAuth-app mismatch is non-blocking,
  logged the exact follow-up text the card specified. Step D — applied
  migration 024 (added oauth_apps.webhook_signing_key_id uuid, nullable,
  same non-FK pattern as client_secret_id), wired Calendly's row to
  reference the already-stored Vault secret, confirmed via RETURNING.
  Ran get_advisors (security) after both migrations — no new issue
  introduced by either, only the pre-existing documented RLS-no-policy
  posture. Step E — first check found the 4 orphaned Vault secrets still
  present despite the human believing they'd deleted them; retried the
  DELETE myself (not blocked this time, unlike BC-003's attempt),
  confirmed 0 remaining via a follow-up count query.
- What was verified live vs. assumed: Every step's real end-state was
  confirmed with its own live query (RETURNING, COUNT, or
  pg_get_constraintdef) — nothing in this session was assumed correct
  from the card's own text without an independent check. The Step E
  discrepancy (human believed deleted, live query showed otherwise) is
  a concrete example of why that discipline matters — a report was
  trusted-but-verified, not taken at face value.
- What broke / changed from plan: Nothing broke. Both real ambiguities
  from BC-003 (Cal.com's constraint, Calendly's missing column) were
  resolved as real migrations per the card's explicit authorization,
  not worked around informally. Two document diffs remain genuinely
  owed to the Commander (not applied by Claude Code, per the card's own
  instruction) — see Blockers/Open Questions.
- Files touched: PROJECT_STATE.md. Database: 2 new migrations (023, 024)
  applied to zenny-vault; control.oauth_apps rows for cal_com and
  calendly updated; 4 vault.secrets rows deleted; 0 rows remain in
  auth.users (deleted outside this session, independently confirmed).
- **Phase 1 verdict: COMPLETE.** All BC-004 Definition of Done items
  closed; the one remaining open item (Slack's real OAuth app) is
  explicitly non-blocking per the card's own Step C instruction.

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
