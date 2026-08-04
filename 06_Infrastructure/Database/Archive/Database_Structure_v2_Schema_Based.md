# Database Structure — v2 (Schema-Based)
### Vault + 5 Archetype Template Schemas

```
Status: Draft for review. Restructured from v1's flat "24 client tables"
model into a schema-tree model per architect direction.
Supersedes: Database_Structure_Full_Draft_v1.md's table list content is
reused below, reorganized — no data/columns lost, only restructured.
```

---

## Schema Tree Overview

```
SUPABASE PROJECT (single project, multiple schemas)
│
├── SCHEMA: vault
│   │   ZeroManual Control Plane. Manually editable. Source of truth.
│   │
│   ├── TABLE: clients
│   ├── TABLE: client_active_modules
│   ├── TABLE: client_config                  ← master copy
│   ├── TABLE: templates                      ← master copy
│   ├── TABLE: email_categories                ← master copy
│   ├── TABLE: recovery_cadence_profiles        ← master copy
│   └── TABLE: sync_log
│
├── SCHEMA: tpl_emergency          ← BUILD-PHASE TEMPLATE, not a live client
│   │
│   ├── [COMMON TABLES] (identical structure across all 5 templates — see
│   │    "Common Tables" section below for full column definitions)
│   │   ├── client_config                      ← synced local copy
│   │   ├── templates                          ← synced local copy
│   │   ├── email_categories                    ← synced local copy
│   │   ├── recovery_cadence_profiles            ← synced local copy (this archetype's rows)
│   │   ├── kb_entries
│   │   ├── customers
│   │   ├── channel_identity_links
│   │   ├── customer_preferences
│   │   ├── active_issues
│   │   ├── leads
│   │   ├── complaints
│   │   ├── growth_events
│   │   ├── growth_handoff_payload
│   │   ├── conversions                        ← core conversion table
│   │   ├── recovery_queue
│   │   ├── suppression_records
│   │   ├── emails
│   │   ├── attachments
│   │   ├── draft_edit_log
│   │   ├── escalations
│   │   └── tool_call_log
│   │
│   └── [ARCHETYPE-SPECIFIC TABLES] (Emergency only)
│       └── conversions_emergency
│
├── SCHEMA: tpl_commerce           ← BUILD-PHASE TEMPLATE
│   ├── [COMMON TABLES]  (same 20 tables as tpl_emergency, identical structure)
│   └── [ARCHETYPE-SPECIFIC TABLES] (Commerce — both sub-variants)
│       ├── conversions_ecom
│       └── conversions_restaurant
│
├── SCHEMA: tpl_appointment        ← BUILD-PHASE TEMPLATE
│   ├── [COMMON TABLES]  (same 20)
│   └── [ARCHETYPE-SPECIFIC TABLES]
│       └── conversions_appointment
│
├── SCHEMA: tpl_consultation       ← BUILD-PHASE TEMPLATE
│   ├── [COMMON TABLES]  (same 20)
│   └── [ARCHETYPE-SPECIFIC TABLES]
│       └── conversions_consultation
│
└── SCHEMA: tpl_engagement         ← BUILD-PHASE TEMPLATE
    ├── [COMMON TABLES]  (same 20)
    └── [ARCHETYPE-SPECIFIC TABLES]
        └── conversions_engagement

────────────────────────────────────────────────────────────

AT CLIENT ONBOARDING (production, not build phase):

  tpl_commerce  --[copy schema]-->  client_042_acme_bakery
                                     (renamed, connected to vault sync +
                                      n8n workflows, exposed via PostgREST)

  The client's live schema is a COPY of the correct template, not a
  reference to it. Each client is fully independent after copying —
  changes to tpl_commerce later do NOT retroactively affect
  client_042_acme_bakery. (See "Template Update Propagation" note below.)
```

---

## Build & Deployment Workflow

```
PHASE A — Build once (this task)
  Design and create all COMMON tables (20) + all ARCHETYPE-SPECIFIC
  extension tables (6, across the 5 archetypes — Commerce has 2).

PHASE B — Assemble 5 templates (build phase, one-time per template)
  For each archetype:
    Create schema tpl_{archetype}
    Copy the 20 common tables into it (empty, structure only)
    Copy that archetype's specific extension table(s) into it
  Result: 5 ready-to-clone template schemas, never used to serve live
  traffic directly.

PHASE C — Client onboarding (production, repeats per new client)
  1. Determine client's archetype (per Client_Onboarding_Guide.md)
  2. Copy the matching tpl_{archetype} schema → new schema named per
     convention (e.g., client_{client_id}_{business_slug})
  3. Register the new schema in Supabase's Exposed Schemas (n8n
     automation — see n8n Notes below, this step is NOT automatic)
  4. Insert the client's row into vault.clients + vault.client_config
  5. Run initial sync: vault → new client schema (populates client_config,
     templates, email_categories, recovery_cadence_profiles with real
     starting values, replacing the empty template structure)
  6. Connect n8n workflows to the new schema (parameterized by schema
     name, not hardcoded — see n8n Notes)
```

---

## VAULT Schema — Table Definitions

### `vault.clients`
```
client_id             | uuid (PK)
business_name           | text
status                     | enum (active/paused/onboarding/offboarded)
billing_tier                 | text
archetype                       | enum (emergency/commerce/appointment/consultation/engagement)
secondary_archetypes                | array of enum, nullable
client_schema_name                     | text     | e.g. "client_042_acme_bakery" — links this row to its live schema
created_date                              | date
```

### `vault.client_active_modules`
```
client_id              | uuid (FK → clients)
module_name               | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
enabled                      | boolean
```

### `vault.client_config` (master)
```
client_id                          | uuid (FK → clients, PK)
freedom_level_override               | number, nullable
language_mode                          | enum (fixed/adaptive)
language_list                             | array of text
default_country_code                        | text
max_booking_horizon                            | number (days)
send_window_start                                | time
send_window_end                                     | time
after_hours_emergency_contact                          | text, nullable
cart_value_escalation_threshold                           | number, nullable
backorder_notification_enabled                               | boolean, nullable
waitlist_enabled                                                | boolean, nullable
appointment_selfservice_link_enabled                               | boolean, nullable
consultation_scoring_enabled                                          | boolean, nullable
realtime_high_intent_alert_enabled                                       | boolean, nullable
program_reactivation_notification_enabled                                  | boolean, nullable
reactivation_threshold_override                                               | number, nullable
conversion_mode_selection                                                        | json    | {archetype: mode} per Universal Mode Naming
email_address                                                                        | text
kb_email_file_id                                                                        | text, nullable
```

### `vault.templates` (master)
```
template_id            | uuid (PK)
client_id                 | uuid (FK → clients), nullable   | null = archetype-level default
template_key                 | text
template_type                   | enum (greeting/recovery_message/escalation_message/booking_confirmation/nurture_message/other)
archetype                          | enum, nullable
language                              | text
content                                  | text
version                                     | number
active                                         | boolean
created_date                                      | date
```

### `vault.email_categories` (master)
```
category_id             | uuid (PK)
client_id                  | uuid, nullable    | null = universal default
category_name                 | text
category_scope                   | enum (customer_facing/operational)
routing_rule                        | text
```

### `vault.recovery_cadence_profiles` (master)
```
archetype               | enum (composite PK with step_number)
step_number                | number
delay_from_previous_step      | number
delay_unit                       | enum (minutes/hours/days)
client_id                           | uuid, nullable   | null = archetype default; non-null = future per-client override
```

### `vault.sync_log`
```
sync_id                | uuid (PK)
client_id                 | uuid (FK → clients)
table_synced                  | text
sync_timestamp                   | timestamp
status                              | enum (success/failed)
triggered_by                           | enum (schedule/manual_edit/on_read)
```

---

## Common Tables (identical structure in every template/client schema)

*Local copies of the 4 synced tables below mirror vault's structure exactly (same columns), populated by sync, not manual edit — the manual editing happens in vault, not here.*

```
{schema}.client_config              — mirrors vault.client_config (this client's row only, flattened)
{schema}.templates                  — mirrors vault.templates (archetype defaults + this client's overrides, pre-merged)
{schema}.email_categories           — mirrors vault.email_categories (universal + this client's extensions, pre-merged)
{schema}.recovery_cadence_profiles  — mirrors vault.recovery_cadence_profiles (this archetype's rows only)
```

### `{schema}.kb_entries`
```
entry_id                | uuid (PK)
category                    | text
question                       | text
answer                            | text
language                             | text
active                                  | boolean
```
*(Previously flagged as missing in v1 — added now.)*

### `{schema}.customers`
```
customer_id              | uuid (PK)
primary_contact_method       | text
session_state                    | enum (new/returning_lead/existing_customer/dormant)
last_conversion_date                | date, nullable
created_date                            | date
```

### `{schema}.channel_identity_links`
```
link_id                  | uuid (PK)
customer_id                  | uuid (FK → customers)
channel_type                    | enum (email/phone/whatsapp/chat_session/sms)
channel_value                       | text
match_confidence                        | enum (verified/probable/weak)
linked_date                                | date
```

### `{schema}.customer_preferences`
```
preference_id             | uuid (PK)
customer_id                   | uuid (FK → customers)
preference_type                   | text
preference_value                     | text
source                                  | enum (explicit_statement/completed_action)
created_date                                | date
last_confirmed                                 | date, nullable
```

### `{schema}.active_issues`
```
issue_id                  | uuid (PK)
customer_id                  | uuid (FK → customers)
current_owner                    | enum (human/live_conversation/email_manager/recovery_engine/automation/none)
issue_reference_type                 | enum (lead/complaint/escalation/conversion), nullable
issue_reference_id                       | uuid, nullable
since_timestamp                             | timestamp
```

### `{schema}.leads`
```
lead_id                    | uuid (PK)
customer_id                    | uuid (FK → customers)
archetype                          | enum          | redundant within a single-archetype schema, kept for
                                                       Commerce's dual sub-variant case (ecom vs restaurant)
intent                                | text
source_channel                           | enum (website/whatsapp/instagram/facebook/email/sms)
conversation_summary                        | text
lead_score                                     | number, nullable
status                                            | enum (new/active/qualified/booked/closed/escalated)
recovery_profile                                     | enum, nullable
validation_flag                                         | boolean
validation_notes                                            | text, nullable
created_date                                                   | date
last_interaction                                                  | date
```

### `{schema}.complaints`
```
complaint_id               | uuid (PK)
lead_id                        | uuid (FK → leads), nullable
customer_id                        | uuid (FK → customers)
issue_description                      | text
distributive_addressed                     | boolean
procedural_addressed                           | boolean
interactional_addressed                            | boolean
resolution                                             | text, nullable
proportionate_remedy_applied                              | boolean
escalated                                                     | boolean
created_date                                                     | date
resolved_date                                                        | date, nullable
```

### `{schema}.growth_events`
```
lead_id                      | uuid (FK → leads, PK)     | one row per lead — see Open Items
buying_stage                     | enum (explorer/evaluator/ready_buyer)
recommended_solution                 | text, nullable
recommendation_reason                    | text, nullable
objection_type                              | enum (price/trust/timing/confusion/competitor), nullable
objection_resolved                              | boolean, nullable
upsell_offered                                     | boolean
upsell_accepted                                       | boolean, nullable
growth_exit_type                                          | enum (handoff_to_conversion/abandoned/recovery_candidate/no_suitable_match)
```

### `{schema}.growth_handoff_payload`
```
lead_id                      | uuid (FK → leads, PK)
selected_solution                | text, nullable
resolved_objections                  | json array, nullable
pending_questions                        | json array, nullable
captured_contact_fields                      | json, nullable
```

### `{schema}.conversions` (core)
```
conversion_id                | uuid (PK)
lead_id                          | uuid (FK → leads)
conversion_mode                      | enum (A/B/C)
conversion_state                         | enum (intent_confirmed/data_collection/action_pending/confirmed/failed_recoverable/failed_escalation/cancelled)
source_module                                | enum (growth_agent/direct)
required_fields_status                           | enum (all_collected/partial/none)
external_action_status                               | enum (success/failed_recoverable/failed_escalation/not_attempted)
failure_reason                                           | text, nullable
final_state                                                  | enum
recovery_eligible                                               | boolean
calendar_event_id                                                  | text, nullable
created_date                                                           | date
confirmed_date                                                             | date, nullable
```
*(Archetype identity is implicit — a `client_042` schema copied from `tpl_commerce` only ever has Commerce-flavored conversions; `archetype` column dropped from v1 since it's now redundant at the schema level, except Commerce's dual sub-variant, tracked via which extension table has the matching row.)*

### `{schema}.recovery_queue`
```
recovery_id                 | uuid (PK)
lead_id                         | uuid (FK → leads)
conversion_id                       | uuid (FK → conversions), nullable
recovery_source                         | enum (A through I, per Module 4 §8)
current_step                                | number
status                                          | enum (active/paused/completed/stopped)   [never "failed"]
next_follow_up                                     | timestamp
last_attempt_date                                     | date, nullable
attempt_count                                             | number
human_ownership_flag                                          | boolean
recovery_context                                                  | json
created_date                                                          | date
```

### `{schema}.suppression_records`
```
suppression_id              | uuid (PK)
contact_method                  | text
suppression_type                    | enum (opt_out/spam_complaint)
channel_scope                           | enum (all/email/sms/whatsapp)
lead_id                                     | uuid (FK → leads), nullable   | nullable for pre-record opt-out
created_date                                    | date
```

### `{schema}.emails`
```
email_id                    | uuid (PK)
customer_id                     | uuid (FK → customers)
lead_id                             | uuid (FK → leads), nullable
gmail_thread_id                         | text
gmail_message_id                            | text
category_id                                     | uuid (FK → email_categories)
thread_lifecycle                                    | enum (open/waiting_customer/waiting_business/resolved/stale)
email_status                                            | enum (new/human_review_required/draft_ready/sent/auto_replied/escalated/closed/error)
reply_style                                                 | enum (scripted/generative)
draft_content                                                   | text, nullable
sent_content                                                        | text, nullable
bounce_status                                                           | enum (delivered/bounced/spam_complaint), nullable
received_date                                                              | date
```

### `{schema}.attachments`
```
attachment_id                | uuid (PK)
email_id                         | uuid (FK → emails)
attachment_type                      | enum (customer_evidence/business_document/identity_payment_sensitive/recruiting/unknown)
```

### `{schema}.draft_edit_log`
```
edit_id                     | uuid (PK)
email_id                        | uuid (FK → emails)
ai_draft                            | text
human_approved_version                  | text
edit_category                               | enum (tone/scope/factual/escalation_violation)
timestamp                                       | date
```

### `{schema}.escalations`
```
escalation_id                | uuid (PK)
lead_id                           | uuid (FK → leads), nullable
customer_id                          | uuid (FK → customers)
escalation_type                          | text
escalation_reason                            | text
escalation_priority                              | enum (P1_immediate/P2_standard/P3_review)
origin_module                                        | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
trigger_condition                                        | text
ownership_state                                              | enum (ai_owned/human_owned/collaborative)
status                                                            | enum (open/resolved)
created_date                                                          | date
resolved_date                                                             | date, nullable
```

### `{schema}.tool_call_log`
```
call_id                     | uuid (PK)
tool_name                        | text
calling_module                        | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
lead_id                                    | uuid, nullable
state                                          | enum (requested/waiting/success/failed/timeout)
request_payload                                    | json
response_payload                                       | json, nullable
timestamp                                                  | timestamp
```

---

## Archetype-Specific Tables (attach only to their matching schema)

### `tpl_emergency` / client-Emergency schemas → `conversions_emergency`
```
conversion_id             | uuid (FK → conversions, PK)
location                      | text
dispatch_window                   | text
team_availability_confirmed           | boolean
```

### `tpl_commerce` / client-Commerce schemas → `conversions_ecom`
```
conversion_id             | uuid (FK → conversions, PK)
items                         | json
quantity                          | number
cart_value                            | number
delivery_details                          | text, nullable
```

### `tpl_commerce` / client-Commerce schemas → `conversions_restaurant`
```
conversion_id             | uuid (FK → conversions, PK)
party_size                    | number
reservation_time                  | timestamp
table_confirmed                       | boolean
special_request                           | text, nullable
```

### `tpl_appointment` / client-Appointment schemas → `conversions_appointment`
```
conversion_id             | uuid (FK → conversions, PK)
service_type                  | text
practitioner                      | text, nullable
appointment_time                      | timestamp
special_request                           | text, nullable
```

### `tpl_consultation` / client-Consultation schemas → `conversions_consultation`
```
conversion_id             | uuid (FK → conversions, PK)
score                         | number
score_tier                        | enum (nurture/scored_booking/priority)
```

### `tpl_engagement` / client-Engagement schemas → `conversions_engagement`
```
conversion_id             | uuid (FK → conversions, PK)
contribution_type             | enum (donate/volunteer/attend)
program_reference                 | text, nullable
tribute_name                          | text, nullable
```

---

## ⚠️ Production Awareness Notes

*(Operational realities to watch for once this is live — not build tasks.)*

1. **No cross-schema foreign keys.** Every FK shown above (e.g., `conversions.lead_id → leads.lead_id`) is *within the same schema* — that's fine. But nothing in a client schema ever FKs to `vault` directly. `client_id` in local `client_config` is a plain value, not an enforced FK — enforcement happens at sync-time logic, not the database constraint level. This was flagged earlier as a hard rule for schema-based multi-tenancy on Supabase specifically.

2. **RLS is your real security boundary, not schema separation alone.** Every table in every client schema needs its own RLS policy actively preventing any cross-tenant read/write. Schema separation organizes the data; RLS is what actually protects it.

3. **Template Update Propagation is NOT automatic.** If you improve `tpl_commerce`'s structure after clients are already copied from it (e.g., add a new column), existing client schemas do **not** inherit that change automatically. This needs a defined migration process (likely: a versioned migration script applied to every live client schema of that archetype) — not designed yet, flag as a real future task once multiple clients exist.

4. **Free tier has zero automated backups.** Given the vault is meant to be a safe, manually-editable source of truth, this is a real risk worth closing early — not blocking this schema design, but shouldn't be left unaddressed once real client data exists.

5. **Exposed Schemas is manual by default.** A new client schema is invisible to the API until registered — see n8n Notes below, this must be automated, not left as a manual step someone forgets.

---

## 🔧 n8n / Build Notes

*(Implementation-layer tasks the build phase needs to handle — not schema decisions.)*

1. **Client onboarding workflow must include an "Expose Schema" API call** — registering the new client schema with Supabase's Data API automatically, not a manual dashboard step. This is the single most commonly-forgotten step in schema-per-tenant setups per the research — build it as a hard, non-skippable step in the onboarding automation.

2. **Every n8n node touching a client schema must select it via `Accept-Profile`/`Content-Profile` headers**, not a hardcoded connection string per client. n8n workflows should be parameterized by schema name (read from `vault.clients.client_schema_name`), so one workflow serves every client rather than needing a workflow copy per client — this is what actually delivers on your "not hardcoded" instruction from earlier.

3. **Sync workflow (vault → client schema)** needs to run on a schedule AND be triggerable on-demand — per your earlier stated preference that a manual edit in the vault shouldn't require someone to remember to also fire a sync. Suggest: scheduled sync every N minutes + a manual "sync now" trigger available per client.

4. **Use the transaction-mode pooler connection**, not direct connections, from n8n workflows — direct connections are the scarcest resource (60 on free tier) and n8n's execution pattern (many short-lived queries) is exactly what transaction-mode pooling is designed for.

5. **Template assembly (Phase B) should itself be a script/workflow, not manual copying** — since you'll want to rebuild the 5 templates cleanly whenever the common table structure changes during the build phase, before any client exists yet.

---

## Carried-Forward Open Items (from v1, still unresolved)

1. **`growth_events`/`growth_handoff_payload` — still one row per lead (summary state), not a full turn-by-turn log.** Unchanged from v1 — needs your confirmation before Phase 3 (SQL).
2. **Recovery cadence per-client override** — the structural hook now exists (`vault.recovery_cadence_profiles.client_id`, nullable), but the actual override logic/UI isn't designed. Fine to defer.
3. ~~KB content storage~~ — **Resolved in this draft**: `kb_entries` added as a common table.

---

## Summary Table Count

```
VAULT:                       7 tables
EACH ARCHETYPE TEMPLATE:
  Common tables:              20  (identical structure, every template)
  Archetype-specific:          1  (Emergency/Appointment/Consultation/Engagement)
                                2  (Commerce — Ecom + Restaurant)

TOTAL DISTINCT TABLE STRUCTURES DESIGNED: 7 + 20 + 6 = 33
```
