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
2026-08-05 — by Claude Code, Session 11 (BC-010 — Phase 4 COMPLETE)

## Current Phase
Phase 4 — Convocore Adapter (ADP-002) — **COMPLETE.** BC-010 closed the
one item BC-009 left open: human-handoff's staged-fallback Stage 2
trigger, built per the Commander's exact operational definition. ADP-002
registered in n8n_Workflow_Specification_v1.md Part 17 (BC-009 — also
closed the gap that ADP-001/Voiceflow was never registered either). All
3 stale "Prospective" lines updated to real status (BC-009). Phases 1-3
remain COMPLETE, unchanged. Phase 5 (4 New Dashboard Systems) is next.

---

## Phase Checklist (mirrors Planning_to_Build_Transition_v1.md Part 4)

```
Phase 0  — Environment Setup .................... IN PROGRESS
Phase 1  — Close Credential Platform Gaps ........ COMPLETE
Phase 2  — Convocore Database Changes ............ COMPLETE
Phase 3  — Remaining Shared Utilities ............ COMPLETE
Phase 4  — Convocore Adapter (ADP-002) ........... COMPLETE
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
control.convocore_agent_map:     BUILT (BC-005, migration 025 + 026 fix).
                                  PK is a surrogate id uuid, NOT client_id
                                  — migration 025 originally used
                                  PRIMARY KEY(client_id), caught as a real
                                  mistake mid-session (would have forced a
                                  1:1 client-agent relationship, directly
                                  contradicting Planning_to_Build_
                                  Transition_v1.md Part 2.1's own stated
                                  reasoning for choosing a dedicated table
                                  in the first place — "not guaranteed 1:1
                                  forever"). Fixed same session, confirmed
                                  live. Columns: client_id (plain FK, not
                                  unique), convocore_agent_id,
                                  convocore_agent_secret_id (Vault ref),
                                  convocore_region, agent_display_name,
                                  created_at, id (PK). RLS enabled, zero
                                  policies, service_role only — same
                                  posture as every other control table.
                                  agent_display_name naming convention
                                  documented via COMMENT ON COLUMN
                                  (migration 027): "{ClientBusinessName}
                                  Assistant", citing Planning_to_Build_
                                  Transition_v1.md Part 2.5 — Convocore_
                                  Findings_Required_Updates_FINAL.md Part
                                  1.2/6.2 alone still read DECISION
                                  NEEDED, resolved via the later,
                                  authoritative Planning doc instead. 0
                                  rows (no live Convocore agent yet, per
                                  card's explicit out-of-scope).
leads (Convocore columns):       ADDED (BC-005, migration 028) — all 6
                                  columns (convocore_conversation_id,
                                  convocore_summary, convocore_sentiment,
                                  convocore_token_usage, convocore_cost,
                                  convocore_lead_score), applied to public
                                  + all 5 tpl_* schemas (Phase B's clone
                                  was one-time, not auto-synced — same
                                  reasoning applied consistently in every
                                  Phase 2 migration touching a mirrored
                                  table). convocore_conversation_id has a
                                  COMMENT ON COLUMN (public only) warning
                                  it's WebSocket-origin ONLY, per
                                  Convocore_Adapter_Spec_FINAL.md Part 12.
escalations.escalation_team:     ADDED (BC-007, migration 032),
                                  Commander-approved per Planning_to_
                                  Build_Transition_v1.md Part 2.3.
                                  Applied to public + all 5 tpl_* schemas
                                  — confirmed LIVE first (not assumed)
                                  that escalations follows the same
                                  mirroring pattern as leads/client_config
                                  (public + tpl_*, not control-only), per
                                  the card's explicit instruction not to
                                  assume this. escalation_reason's mapping
                                  onto Convocore's issue_summary
                                  re-confirmed live before the migration
                                  (still text NOT NULL, unchanged) — no
                                  change needed there. Column has a
                                  COMMENT ON COLUMN (public only)
                                  explaining its origin. A throwaway test
                                  client schema (client_test_001_acme_
                                  emergency_test, from earlier Phase C
                                  onboarding testing per Client_
                                  Onboarding_Sequence_Spec.md) also has an
                                  escalations table — deliberately left
                                  untouched, out of scope, matching how
                                  BC-005 treated non-template schemas.
client_config voice/SMS fields:  ADDED (BC-005, migrations 029 + 030) —
                                  voice_agent_enabled boolean NOT NULL
                                  DEFAULT false, sms_agent_enabled
                                  boolean NOT NULL DEFAULT false,
                                  client_voice_number text NULL,
                                  client_sms_number text NULL. Applied to
                                  control.client_config (029) AND public +
                                  all 5 tpl_* client_config (030, same
                                  mirrored-table consistency reasoning as
                                  leads above — client_config is one of
                                  the 21 "common tables" per Database_
                                  Structure_v4_FINAL.md §4).
Twilio credential schema:        ADDED (BC-005, migration 031), SCHEMA
                                  ONLY — no real Twilio credential
                                  seeded, per the card's explicit
                                  out-of-scope. Decided (not flagged):
                                  Twilio has no Zenny-owned OAuth app —
                                  every client brings their own Account
                                  SID/Auth Token/number entirely
                                  independently (Convocore_Adapter_Spec_
                                  FINAL.md Part 13.3) — structurally
                                  identical to WooCommerce's Part 8.3
                                  pattern, not oauth_apps' shared-app
                                  model. Added 'twilio' to oauth_apps'
                                  provider CHECK (placeholder row,
                                  app_status='not_applicable', same
                                  shape as woocommerce's row) and
                                  'telephony' to client_connections'
                                  category CHECK — ONE category, not
                                  separate 'voice'/'sms', since voice and
                                  SMS confirmed to share the same
                                  underlying Twilio credential/number
                                  (Planning doc Part 2.9/4); voice_agent_
                                  enabled/sms_agent_enabled stay separate
                                  flags on client_config regardless. Real
                                  per-client rows would use client_
                                  connections' existing secondary_secret_id
                                  (Account SID + Auth Token, same 2-part
                                  pattern as WooCommerce's Consumer
                                  Key+Secret) — no new column needed for
                                  that when real seeding happens later.
No product/inventory tables:     DOCUMENTED, PERMANENT NOTE (BC-005 Step
                                  6, Planning doc Part 4 Phase 2 item 5):
                                  Zenny's own database NEVER stores
                                  product or inventory data, for any
                                  client, under any archetype. Product
                                  catalogue and inventory data flow
                                  Shopify/WooCommerce → a sync workflow
                                  (not yet built, Findings doc Part 3.3 /
                                  Workflow Spec SCH item) → Convocore's KB
                                  directly. A future session must NOT
                                  introduce a products/inventory table
                                  under any schema — if a real need
                                  surfaces, that's a Change Request
                                  against this note, not a silent add.

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
UTIL-001 Schema Resolver:         BUILT (BC-008), n8n workflow ID
                                  qbhdmH2ZN6opkXL1. Execute Workflow
                                  Trigger(client_id) -> HTTP GET
                                  control.clients (Accept-Profile:
                                  control) -> IF found -> {resolved:true,
                                  client_schema_name} / else -> {resolved:
                                  false, error_type:'permanent'} per Part
                                  6.1's Fallback D behavior. Confirmed
                                  live via get_workflow_details (5 nodes,
                                  wiring matches design exactly). Supabase
                                  credential explicitly reassigned to the
                                  real existing "zenny-vault-suparbase"
                                  (id guCWYmcVycnfMixw) after
                                  create_workflow_from_code initially
                                  created a duplicate EMPTY credential
                                  under the same name instead of reusing
                                  it — caught and fixed same session.
UTIL-002 Data Validator:          BUILT (BC-008), n8n workflow ID
                                  Cw1LW6ZXHaJkrJLB. Execute Workflow
                                  Trigger(envelope fields) -> Code node
                                  checks contract_version==='v1' +
                                  required fields present -> {valid,
                                  validation_flag, errors, payload}.
                                  Generic envelope-layer validation only
                                  (Part 6.2) — real per-Tool field
                                  validation is each Tool's own Business
                                  Workflow's job, not invented here.
                                  Confirmed live, no credential needed.
UTIL-003 Error Logger:            BUILT (BC-008), n8n workflow ID
                                  Azi7BaBldiK3NDqk. Execute Workflow
                                  Trigger(client_schema_name + log
                                  fields) -> HTTP POST tool_call_log
                                  (Content-Profile: resolved schema,
                                  onError: continueRegularOutput so a
                                  logging failure never blocks the
                                  caller, per Part 6.3's Failure
                                  Behavior). Confirmed live, credential
                                  fixed to real zenny-vault-suparbase
                                  same as UTIL-001.
UTIL-004 Notification Router:     BUILT (BC-008), n8n workflow ID
                                  fcilrbwldjnn92Yn, PARTIALLY FUNCTIONAL
                                  BY DESIGN. Two parallel branches from
                                  one trigger (notify_email/notify_slack
                                  booleans): email branch uses the native
                                  Gmail node + the real existing
                                  "zenny-gmail" credential (this is
                                  Zenny's own internal ops account, not a
                                  per-client dynamic credential, so the
                                  native-node-vs-HTTP-Request distinction
                                  in the credential-testing standing rule
                                  doesn't apply the same way it does to
                                  client integrations) — recipient address
                                  left as a placeholder() pending a real
                                  ops inbox decision. Slack branch is
                                  structurally correct (HTTP Request +
                                  Generic Header Auth, per the standing
                                  rule) but its credential was deliberately
                                  left unconfigured — confirmed live via
                                  list_credentials that ZERO Slack
                                  credential of any kind exists in this
                                  n8n instance (not even the flagged bot
                                  token from BC-004 Step C), so there is
                                  currently nothing to even attempt wiring
                                  in. BLOCKED, not broken — matches the
                                  card's explicit instruction to flag
                                  rather than fake a workaround. Gmail
                                  credential attachment could not be
                                  visually re-confirmed via
                                  get_workflow_details (credentials
                                  objects are redacted from that read) —
                                  inferred working from
                                  create_workflow_from_code's response
                                  only flagging the Slack node as skipped,
                                  not the Gmail node; genuinely unverified
                                  beyond that inference.
UTIL-005 Stop Checker:            BUILT (BC-008), n8n workflow ID
                                  IWuuNyRjp7vPjNui. Execute Workflow
                                  Trigger(check_type, entity_value,
                                  client_schema_name) -> Switch
                                  (suppression / lead_status / fallback)
                                  -> real HTTP GET against
                                  suppression_records or leads.status in
                                  the resolved client schema ->
                                  {proceed: boolean, reason}. Unknown
                                  check_type routes to a dedicated
                                  "Retryable Error" branch returning
                                  proceed:false, matching Part 6.5's
                                  explicit Failure Behavior ("do not
                                  proceed on an unresolved stop-check").
                                  Confirmed live, both HTTP nodes'
                                  credentials fixed to real
                                  zenny-vault-suparbase.
ADP-002 Convocore Adapter:        BUILT (BC-009), n8n workflow ID
                                  BOxeuH6ehv46FZL0, 16 nodes, confirmed
                                  live via get_workflow_details. Real
                                  webhook: POST https://n8n-cbzu.
                                  srv1881104.hstgr.cloud/webhook/
                                  convocore-adapter. Implements: Step 1
                                  client resolution (agentId ->
                                  convocore_agent_map -> client_id) with a
                                  REAL Bearer-vs-agent-secret comparison
                                  (not a stub) via the same
                                  read_credential_secret RPC UTIL-006
                                  itself uses internally -- literal
                                  "call UTIL-006 as a sub-workflow" per
                                  the card's wording wasn't actually
                                  possible: UTIL-006's real contract
                                  (verified BC-003/BC-008) queries
                                  control.client_connections by
                                  client_id+category, which has no path
                                  to convocore_agent_map's secret at all
                                  -- used the same underlying secure
                                  mechanism directly instead, flagged
                                  here as a disclosed implementation
                                  deviation, not a silent one. Step 2
                                  Standard Request Contract mapping built
                                  per Part 3.2's exact field table,
                                  including the idempotency_key pattern
                                  ({kebab_tool}_{client_id}_
                                  {conversation_id}) taken directly from
                                  the Adapter Spec's own Part 3.2 (which
                                  itself already names this exact
                                  pattern, citing Integration Contract
                                  Part 20). conversation_id is passed
                                  through AS-IS -- **explicit limitation,
                                  not silently assumed safe:** this build
                                  has NO reliable way to detect whether a
                                  given conversation_id originated via
                                  WebSocket vs POST /convos (Part 12.2's
                                  structurally-broken-conversation rule);
                                  downstream consumers must not assume
                                  WebSocket-only traffic. runtime_module
                                  is explicitly left null by the Adapter,
                                  confirmed NOT inferred (Part 8 — lives
                                  in embedded Convocore prompt logic
                                  instead, genuinely external to this
                                  workflow). Step 3: Tool Name pure
                                  pass-through, Variables become payload
                                  as-is (ENV variables never appear in
                                  Convocore's own outbound payload in the
                                  first place, per Part 5.3 — nothing to
                                  filter, confirmed by design not by
                                  active filtering logic), System Tools
                                  (forward-call/end-call) routed to a
                                  dedicated exclusion branch with zero
                                  contract mapping. Step 4: Shopify
                                  explicitly routed to its own exclusion
                                  branch BEFORE the standard-tool
                                  fallback catches it — confirmed not an
                                  accidental catch-all omission. Step 5:
                                  human-handoff writes a REAL escalations
                                  row (customer_id, escalation_type,
                                  escalation_reason<-issue_summary,
                                  escalation_team<-team_key using BC-007's
                                  column, origin_module, trigger_condition,
                                  ownership_state, status) via UTIL-001
                                  Schema Resolver + a direct Supabase
                                  insert — staged-fallback "insufficient"
                                  trigger condition BUILT (BC-010, see
                                  below) — Phase 4 now COMPLETE.
                                  NOT end-to-end live-tested against a
                                  real Convocore agent (none exists —
                                  explicitly out of scope) or a real
                                  client_id in convocore_agent_map (0 rows
                                  still, per BC-005) — internal structural
                                  verification only (get_workflow_details
                                  confirms every node/wire matches
                                  design), consistent with these cards'
                                  own scoping.
                                  **BC-010 addition — Stage 2 staged-
                                  fallback trigger:** 4 new nodes added to
                                  the human-handoff branch (20 nodes
                                  total now). Per Commander decision
                                  (BC-010): re-confirmed live first that
                                  the Complaint Handler's "two resolution
                                  attempts" precedent and Step 1D.2
                                  Confidence Gate still hold in
                                  Agent_Runtime_System_v1.md unchanged
                                  since BC-009. Mechanism: since the
                                  Adapter never sees raw conversation
                                  turns (only discrete Tool calls), the
                                  actual NLP-level signal detection
                                  (customer indicates unresolved / re-
                                  raises intent / Confidence Gate Low-
                                  Conflicting) cannot live in the Adapter
                                  — it belongs to Convocore's own embedded
                                  prompt logic (Part 8), which DOES see
                                  the conversation. The Adapter-buildable,
                                  non-timer signal is: "Check Existing
                                  Open Escalation" (HTTP GET, customer_id
                                  + escalation_type + status='open') runs
                                  before every escalation write; "
                                  Escalation Already Open? (Stage 2
                                  Signal)" (IF) treats a SECOND human-
                                  handoff call for an already-open
                                  escalation as Convocore's embedded logic
                                  having already determined the Commander's
                                  signal fired — the Adapter recognizes
                                  the event, it doesn't re-derive the NLP
                                  judgment. No timeout/timer anywhere,
                                  matching the card's explicit
                                  instruction. On trigger: "Fire Stage 2
                                  Notification (UTIL-004)" (Execute
                                  Workflow, mode:once, workflowId
                                  fcilrbwldjnn92Yn) with notify_email:true
                                  AND notify_slack:true — email
                                  confirmed functional (BC-008), Slack
                                  confirmed STILL credential-blocked
                                  (BC-004 Step C / BC-008, re-verified,
                                  not re-checked live this session but no
                                  new Slack credential has been added
                                  since) — fires anyway since UTIL-004's
                                  Slack node already has onError:
                                  continueRegularOutput (BC-008), so a
                                  failed Slack attempt never blocks the
                                  email delivery. Stage 1's response
                                  wording updated to clarify it's Stage 1
                                  specifically. Caught and fixed 2 real
                                  bugs mid-session: (1) the new "Check
                                  Existing Open Escalation" node's
                                  Supabase credential didn't attach on
                                  first attempt despite an explicit
                                  credential object in the addNode
                                  operation — fixed via a follow-up
                                  setNodeCredential call; (2) a
                                  setNodeParameter call with path
                                  "/parameters/responseBody" created a
                                  malformed DOUBLE-NESTED parameters
                                  object instead of replacing the field —
                                  caught via get_workflow_details,
                                  corrected via updateNodeParameters with
                                  replace:true. Full 20-node structure
                                  reconfirmed live after both fixes.
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
NONE blocking Phase 4 closure. Phase 4 is COMPLETE as of BC-010.

Resolved this session (BC-010), no longer open:
- human-handoff's staged-fallback trigger condition — built per the
  Commander's exact operational definition, confirmed live (20 nodes).

Doc diff flagged for Commander to apply (BC-010 Step 2, not applied by
Claude Code — Section 13's standing rule, same pattern as BC-006/BC-009):
- Agent_Runtime_System_v1.md's "##### D. Human Handoff Handler" section
  needs a new subsection documenting the Stage 2 staged-fallback
  addition (Commander's BC-010 decision + the Adapter-level mechanism
  actually used to detect it — see PROJECT_STATE.md's ADP-002 entry
  above for the exact mechanism, or n8n workflow BOxeuH6ehv46FZL0
  directly). Exact insertion point: after the existing "What context is
  passed to human agent" paragraph (line ~3370) and before "Escalation
  Priority Classification" — a natural place for a "Staged Fallback
  (Stage 2)" subsection. Suggested content: the Commander's exact
  3-condition definition from this card, the "silence is not a negative
  signal" clarification, and a pointer to ADP-002 as the implementing
  mechanism (Runtime docs describe behavior, not n8n wiring — full
  technical detail belongs in the Adapter Spec / PROJECT_STATE.md, not
  duplicated here).

Open, non-blocking follow-up (BC-009):
- ADP-002 has never been tested against real Convocore traffic — no live
  agent exists yet (separate, paused lane per human's own instruction),
  and control.convocore_agent_map still has 0 rows (BC-005). Structural
  verification only. Real end-to-end testing is a future item once a
  real agent + convocore_agent_map row exist.
- Known, disclosed implementation deviation: the card asked for "UTIL-006
  Credential Resolver... per its existing contract" to fetch the agent's
  secret. UTIL-006's REAL contract (client_connections-scoped) has no
  path to convocore_agent_map's secret — used the same underlying
  read_credential_secret RPC directly instead of literally invoking
  UTIL-006 as a sub-workflow. Functionally equivalent (same Vault
  mechanism, same security guarantee), architecturally not identical to
  the literal instruction — flagged for Commander awareness, not hidden.
- SCH-{NNN} Shopify/WooCommerce -> Convocore KB sync workflow (Findings
  doc Part 3.3) — confirmed real, not yet designed or built. Explicitly
  out of BC-009's scope; logging its existence per the card's own
  instruction so it isn't lost before Phase 11 (Scheduled Workflows).

NONE blocking Phase 3 closure. Phase 3 is COMPLETE as of BC-008.

Open, non-blocking follow-up (BC-008):
- UTIL-004's Slack branch cannot send until a real Slack credential
  exists — same underlying gap as BC-004 Step C's Slack OAuth app item,
  now also blocking UTIL-004 specifically, not just future Slack
  notification generally. Confirmed live: zero Slack credentials of any
  kind exist in n8n right now. Email branch is fully functional.
- Found 2 legacy n8n workflows from an old, pre-current-architecture
  numbering scheme: "WF-501 — Error Logger" (id bc6dTzeicmbt3k6l) and
  "WF-503 — Data Validator" (id uYA7ONZa2R6QOR8V), both inactive, 0
  triggers, created 2026-06-12 (predates this project's current
  n8n_Workflow_Specification_v1.md UTIL-{NNN} convention entirely).
  NOT MCP-accessible (availableInMCP: false) — could not inspect their
  actual node contents, and no MCP tool exists to toggle that flag
  remotely. Not touched, not deleted, not adopted/renamed. Flagged for
  Commander review: likely safe to archive/delete as legacy duplicates
  of UTIL-002/UTIL-003 (now genuinely built under the correct
  convention), but that's a human call given Claude Code couldn't
  verify their contents.
- Workflow Spec registration diff (per BC-008 Step 6, Section 13's
  standing rule — Claude Code flags, Commander applies): n8n_Workflow_
  Specification_v1.md Part 6.10's Utility ID Summary currently lists
  only names/IDs, no build-status column. Suggested addition (exact
  diff, Commander's call on placement/format):
    UTIL-001 Schema Resolver         — Built, BC-008 (n8n: qbhdmH2ZN6opkXL1)
    UTIL-002 Data Validator          — Built, BC-008 (n8n: Cw1LW6ZXHaJkrJLB)
    UTIL-003 Error Logger            — Built, BC-008 (n8n: Azi7BaBldiK3NDqk)
    UTIL-004 Notification Router     — Built, BC-008, PARTIAL (email works;
                                        Slack blocked, see above)
                                        (n8n: fcilrbwldjnn92Yn)
    UTIL-005 Stop Checker            — Built, BC-008 (n8n: IWuuNyRjp7vPjNui)
    UTIL-006 Credential Resolver     — Built, prior session (n8n: LzP5m25iMmhROVsD)

NONE blocking Phase 2 closure. Phase 2 is COMPLETE as of BC-007.

NONE blocking Phase 1 closure. Phase 1 remains COMPLETE as of BC-004.

Resolved this session (BC-007), no longer open:
- escalations.escalation_team — added (migration 032), Commander-
  approved, confirmed live in public + all 5 tpl_* schemas.

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

### Session 11 — 2026-08-05 — BC-010: Phase 4 closure (Stage 2 trigger)
- What was done: Re-confirmed live (grep against the real file, not
  memory) that the Complaint Handler's "two resolution attempts"
  threshold and Step 1D.2 Confidence Gate precedent both still hold
  unchanged in Agent_Runtime_System_v1.md since BC-009, per the card's
  own instruction to verify rather than assume nothing shifted. Designed
  the Stage 2 trigger around the real architectural constraint that the
  Adapter never sees raw conversation content (only discrete Convocore
  Tool calls) — the Commander's 3-condition signal genuinely can only be
  evaluated by Convocore's own embedded prompt logic (Part 8), so the
  Adapter's correct role is recognizing that signal's occurrence, not
  re-deriving it. Implemented as: a second human-handoff call arriving
  while an escalation is already open IS that recognition event. Added 4
  nodes to ADP-002's human-handoff branch via update_workflow (existing
  workflow, not rebuilt from scratch). Fired UTIL-004 with both
  notify_email and notify_slack true — Slack still credential-blocked
  (unchanged since BC-004/BC-008), fires anyway since UTIL-004's Slack
  node already has onError:continueRegularOutput, so a failed Slack
  attempt can't block email delivery. Drafted the exact doc diff for
  Agent_Runtime_System_v1.md, did not apply it (Section 13).
- What was verified live vs. assumed: The Complaint Handler/Confidence
  Gate precedent check was a real grep against the current file content,
  not an assumption carried from BC-009's context. Two real mistakes
  were caught via get_workflow_details after the first update_workflow
  call: a credential that didn't attach despite being explicitly passed
  in the addNode operation, and a setNodeParameter path
  ("/parameters/responseBody") that created a malformed nested
  duplicate parameters object instead of replacing the field. Both
  fixed via follow-up operations (setNodeCredential,
  updateNodeParameters with replace:true) and reconfirmed live before
  considering the card done.
- What broke / changed from plan: The first update_workflow batch
  technically "succeeded" (11 operations applied) but left 2 real
  defects that weren't visible without a follow-up read — a concrete
  instance of why this project's "confirm real end-state, don't trust
  the tool's success response alone" discipline exists.
- Files touched: PROJECT_STATE.md. n8n: ADP-002 (BOxeuH6ehv46FZL0)
  updated in place, 20 nodes total now (was 16).
- **Phase 4 verdict: COMPLETE.** Both BC-009 and BC-010 items closed;
  the only remaining item is the doc diff, correctly flagged for the
  Commander rather than self-applied.

### Session 10 — 2026-08-05 — BC-009: Phase 4 (ADP-002 Convocore Adapter)
- What was done: Step 0 — verified live that NO ADP-{NNN} registry table
  existed anywhere in n8n_Workflow_Specification_v1.md (not even for the
  already-production Voiceflow Adapter) before assuming "002" was safe.
  Created Part 17 (new) registering both ADP-001 Voiceflow and ADP-002
  Convocore in one table, closing both gaps together rather than leaving
  Voiceflow's retroactive registration for later. Updated all 3 stale
  "Prospective" lines (n8n_Workflow_Specification_v1.md's Part 3 prose,
  INTEGRATION_CONTRACT_v1.md Part 17.4, n8n_Execution_Architecture_v1.md
  Part 16.4) directly to real final status in one pass, since the card's
  two-pass instruction ("Specified" then real status) collapsed naturally
  once the whole build was already complete by the time these edits were
  written. Built ADP-002 as a single n8n workflow (webhook trigger, 16
  nodes): client resolution against convocore_agent_map with a real
  Bearer-vs-secret comparison, full Standard Request Contract field
  mapping per Part 3.2's table, Tool Name/Variable pass-through, explicit
  System Tool and Shopify exclusion branches (checked BEFORE the standard
  fallback, not caught by omission), and a human-handoff branch that
  writes a real escalations row via UTIL-001 + a direct Supabase insert.
  Did NOT build the staged-fallback trigger condition — flagged per the
  card's explicit instruction, mirroring BC-005 Step 4's precedent.
- What was verified live vs. assumed: Confirmed via grep that zero
  ADP-{NNN} entries existed anywhere before creating Part 17 — not
  assumed from the card's "002" framing alone. Confirmed the workflow's
  full real saved structure via get_workflow_details after the
  credential-fix pass (16 nodes, wiring matches design exactly). Could
  NOT verify end-to-end runtime behavior — no live Convocore agent and 0
  rows in convocore_agent_map, both explicitly out of this card's scope.
  Disclosed rather than glossed over: UTIL-006's real contract doesn't
  actually support the literal "call UTIL-006" instruction (verified by
  re-reading its own trigger inputs — client_id/category/tool_name, no
  agent-secret path) — used the same underlying RPC directly, flagged as
  a deviation, not silently substituted.
- What broke / changed from plan: Nothing broke against the card's own
  scope. The human-handoff sub-decision is the one intentional
  incompleteness, matching the card's own Definition of Done wording.
- Files touched: n8n_Workflow_Specification_v1.md (new Part 17 + Part 3
  prose fix), INTEGRATION_CONTRACT_v1.md (Part 17.4 table),
  n8n_Execution_Architecture_v1.md (Part 16.4), PROJECT_STATE.md. n8n: 1
  new workflow (BOxeuH6ehv46FZL0, 16 nodes) + 1 credential-fix update.
- **Phase 4 verdict: NOT COMPLETE.** ADP-002 is built and internally
  verified in full per its documented scope. The single remaining gap —
  human-handoff's staged-fallback trigger condition — is a genuine,
  deliberate stop per the card's own instruction, not an oversight; it
  needs an explicit Commander decision on what "insufficient" means
  before it can be built.

### Session 9 — 2026-08-05 — BC-008: Phase 3 (UTIL-001 through UTIL-005)
- What was done: Step 0 — searched n8n for anything resembling UTIL-001
  through UTIL-005 before building. Found 2 legacy, non-MCP-accessible
  workflows under an old WF-5xx numbering scheme (Error Logger, Data
  Validator) — flagged, not touched, not adopted. Confirmed no real
  n8n folder structure exists anywhere in this instance (matches
  UTIL-006/SCH-006's precedent of flat naming instead of folders) — built
  the same way. Built all 5 utilities per their exact Workflow Spec Part
  6.1-6.5 contracts (input/output/failure-behavior), using the same
  HTTP-Request-to-PostgREST pattern already established by UTIL-006/
  SCH-006. Caught and fixed a real credential-wiring bug: create_
  workflow_from_code's newCredential() by name created NEW empty
  credentials instead of reusing the real existing "zenny-vault-
  suparbase" — fixed via setNodeCredential on every affected node, same
  session. For UTIL-004, confirmed live (list_credentials) that zero
  Slack credentials exist anywhere in this n8n instance before deciding
  how to build the Slack branch — built it structurally correct (HTTP
  Request + Generic Header Auth per the standing credential-testing
  rule) with the credential deliberately left unconfigured, per the
  card's explicit instruction not to fake a workaround. Used the native
  Gmail node (not HTTP Request) for the email branch since it's Zenny's
  own internal ops account, not a per-client dynamic credential — judged
  outside the scope of the native-node-prohibition rule, which targets
  client integrations specifically.
- What was verified live vs. assumed: Every workflow's real saved
  structure was confirmed via get_workflow_details after creation (node
  count, wiring, parameters) — not assumed from the creation call's
  success response alone. One genuine, disclosed limitation: node-level
  credential attachment itself is not visible via get_workflow_details
  (redacted) — Gmail's credential is inferred working (create_workflow_
  from_code's response only flagged the Slack node as needing manual
  config, not Gmail) but not independently re-confirmed live; flagged as
  such rather than stated as fact. Chose "zenny-vault-suparbase" over
  the other ambiguously-named Supabase credential ("Zenny Dashboard
  Service Key Role") based on strong name-match evidence, not an
  end-to-end tested call — also disclosed, not silently assumed certain.
- What broke / changed from plan: Nothing broke against the card's
  scope. The credential-duplication bug was caught and fixed within the
  same session before it could propagate to more workflows.
- Files touched: PROJECT_STATE.md. n8n: 5 new workflows created
  (qbhdmH2ZN6opkXL1, Cw1LW6ZXHaJkrJLB, Azi7BaBldiK3NDqk, IWuuNyRjp7vPjNui,
  fcilrbwldjnn92Yn), each with a follow-up credential-fix update where
  needed. No existing workflow modified or deleted.
- **Phase 3 verdict: COMPLETE.** All 5 utilities built, live-confirmed,
  matching their documented contracts. UTIL-004's Slack send is
  intentionally non-functional (credential gate) — not a defect, per the
  card's own Definition of Done wording ("explicitly reported, not
  glossed over").

### Session 8 — 2026-08-05 — BC-007: Phase 2 closure
- What was done: Confirmed live (not assumed) that escalations mirrors
  the same public + 5 tpl_* pattern as leads/client_config, not
  control-only. Re-confirmed live that escalation_reason (text NOT NULL)
  is unchanged, so its mapping onto Convocore's issue_summary still
  holds. Applied migration 032: escalation_team text NULL added to
  public + all 5 tpl_* escalations, per Planning_to_Build_Transition_
  v1.md Part 2.3's Commander-approved resolution. Confirmed the new
  column live in all 6 schemas via information_schema. Ran get_advisors
  (security) — only the same pre-existing RLS-no-policy advisory, nothing
  new. Left the throwaway client_test_001_acme_emergency_test schema's
  escalations table untouched, out of scope (matches BC-005's precedent
  for non-template schemas).
- What was verified live vs. assumed: Both explicit "confirm live, don't
  assume" instructions in the card were honored with real queries before
  any write — escalations' schema-mirroring pattern and escalation_
  reason's current shape.
- What broke / changed from plan: Nothing. Straightforward close-out of
  the one item BC-005 correctly left open.
- Files touched: PROJECT_STATE.md. Database: 1 new migration (032)
  applied to zenny-vault, 6 schemas touched (public + 5 tpl_*).
- **Phase 2 verdict: COMPLETE.** All 7 BC-005/BC-007 items closed.

### Session 7 — 2026-08-05 — BC-005: Phase 2 (6/7 items closed)
- What was done: Step 0 — live audit found no drift (convocore_agent_map
  didn't exist; leads/escalations had zero Convocore columns anywhere
  across public + 5 tpl_* schemas; client_config confirmed as its own
  table). Step 1 — created control.convocore_agent_map (migration 025).
  Step 2 — resolved the agent-naming DECISION NEEDED via Planning_to_
  Build_Transition_v1.md Part 2.5, documented as a COMMENT ON COLUMN
  (migration 027). Step 3 — added all 6 Convocore columns to leads
  across public + 5 tpl_* (migration 028). Step 4 — did NOT resolve
  escalation_team; Findings doc Part 1.8 itself is still open and the
  card's own instruction for this specific step required a hard stop —
  flagged with a fast-path pointer instead of guessing. Step 5 — added
  voice/SMS fields to control.client_config (029) AND, for consistency
  with Step 3's mirrored-table reasoning, to public + 5 tpl_*
  client_config too (030). Step 6 — documented the permanent no-product-
  tables note in this file's Database section. Step 7 — decided (not
  flagged) Twilio's schema shape: added 'twilio' to oauth_apps' provider
  CHECK and 'telephony' to client_connections' category CHECK (migration
  031), mirroring WooCommerce's no-Zenny-app pattern exactly; one shared
  telephony category, not separate voice/sms, since Planning doc confirms
  they share one credential. Schema only, no real Twilio credential
  seeded. Ran get_advisors (security) after every migration in this
  session — only pre-existing, documented RLS-no-policy advisories,
  nothing new introduced anywhere.
- What was verified live vs. assumed: Every migration's real end-state
  was confirmed via a follow-up query (list_tables verbose, RETURNING,
  or pg_get_constraintdef) before moving to the next step. Caught and
  fixed a real mistake mid-session: migration 025 initially used PRIMARY
  KEY(client_id) on convocore_agent_map, which would have silently
  forced a 1:1 client-to-agent relationship — directly contradicting the
  documented reasoning (Planning doc Part 2.1) for why a dedicated table
  was chosen over columns-on-clients in the first place. Fixed via
  migration 026 in the same session, confirmed live, before continuing.
- What broke / changed from plan: Step 4 (escalation_team) is genuinely
  not done — not a missed step, a deliberate stop per the card's own
  stricter instruction for that item specifically. Everything else in
  BC-005 was completed as scoped.
- Files touched: PROJECT_STATE.md. Database: 7 new migrations (025-031)
  applied to zenny-vault; 1 new Vault secret (Twilio placeholder); 1 new
  oauth_apps row (twilio, placeholder); no client-facing rows written
  anywhere (no live client exists yet).
- **Phase 2 verdict: NOT COMPLETE.** 6 of 7 items closed with real,
  live-verified migrations. The 1 remaining item (escalations.
  escalation_team) is correctly, deliberately open per the card's own
  explicit instruction — not an oversight, and has a clear, fast
  resolution path once the Commander signs off.

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
