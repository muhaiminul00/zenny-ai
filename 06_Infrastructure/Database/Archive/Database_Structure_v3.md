# Zenny Database Structure v3 — FROZEN
### Schema-Based Multi-Tenant Design (Control + 5 Archetype Templates)

```
Status:    FROZEN — Source of truth for SQL migration and implementation.
Platform:  Supabase (Postgres), single project, multiple schemas.
Frozen:    After v1 (flat model) → v2 (schema-tree restructure) →
           v3 (client_config restructure + agent_prompts + gap resolution).
Supersedes: Database_Structure_Full_Draft_v1.md,
           Database_Structure_v2_Schema_Based.md,
           Database_Structure_v3_Delta.md — all superseded by this
           single, complete, standalone document. Prior drafts kept for
           history, not for reference going forward.
```

---

## 1. Schema Tree Overview

```
SUPABASE PROJECT (single project, multiple schemas)
│
├── SCHEMA: control
│   │   ZeroManual Control Plane. Manually editable. Source of truth.
│   │   RLS: default-deny for anon/authenticated. Only service_role
│   │   (used by n8n) has access.
│   │
│   ├── TABLE: clients
│   ├── TABLE: client_active_modules
│   ├── TABLE: client_config              ← master (global fields + per-archetype JSONB)
│   ├── TABLE: templates                  ← master (synced to client schemas)
│   ├── TABLE: email_categories            ← master (synced to client schemas)
│   ├── TABLE: recovery_cadence_profiles    ← master (synced to client schemas)
│   ├── TABLE: agent_prompts                ← master ONLY — never synced, never
│   │                                          copied to any client schema
│   └── TABLE: sync_log
│
├── SCHEMA: tpl_emergency          ← BUILD-PHASE TEMPLATE, not a live client
│   │
│   ├── [21 COMMON TABLES — identical structure across all 5 templates]
│   │   ├── client_config                  ← synced local copy (this client's row, flattened)
│   │   ├── templates                       ← synced local copy
│   │   ├── email_categories                 ← synced local copy
│   │   ├── recovery_cadence_profiles          ← synced local copy (this archetype's rows)
│   │   ├── kb_entries
│   │   ├── customers
│   │   ├── channel_identity_links
│   │   ├── customer_preferences
│   │   ├── active_issues
│   │   ├── leads
│   │   ├── complaints
│   │   ├── growth_events
│   │   ├── growth_handoff_payload
│   │   ├── conversions                     ← core conversion table
│   │   ├── recovery_queue
│   │   ├── suppression_records
│   │   ├── emails
│   │   ├── attachments
│   │   ├── draft_edit_log
│   │   ├── escalations
│   │   └── tool_call_log
│   │
│   └── [ARCHETYPE-SPECIFIC TABLES — Emergency only]
│       └── conversions_emergency
│
├── SCHEMA: tpl_commerce           ← BUILD-PHASE TEMPLATE (Ecom + Restaurant sub-variants)
│   ├── [21 COMMON TABLES]  (identical structure to tpl_emergency's)
│   └── [ARCHETYPE-SPECIFIC TABLES]
│       ├── conversions_ecom
│       └── conversions_restaurant
│
├── SCHEMA: tpl_appointment
│   ├── [21 COMMON TABLES]
│   └── [ARCHETYPE-SPECIFIC TABLES]
│       └── conversions_appointment
│
├── SCHEMA: tpl_consultation
│   ├── [21 COMMON TABLES]
│   └── [ARCHETYPE-SPECIFIC TABLES]
│       └── conversions_consultation
│
└── SCHEMA: tpl_engagement
    ├── [21 COMMON TABLES]
    └── [ARCHETYPE-SPECIFIC TABLES]
        └── conversions_engagement

────────────────────────────────────────────────────────────

AT CLIENT ONBOARDING (production, repeats per new client):

  tpl_commerce  --[copy schema]-->  client_042_acme_bakery
                                     (renamed, RLS applied, registered in
                                      Exposed Schemas, synced from control,
                                      connected to n8n workflows)

  Live client schemas are COPIES of the correct template — fully
  independent after copying. Changes to a template later do NOT
  retroactively affect already-onboarded clients (see §6, Item 1).
```

---

## 2. Build & Deployment Workflow

```
PHASE A — Build once
  Design and create all 21 COMMON tables + all 6 ARCHETYPE-SPECIFIC
  extension tables. This document is the spec for that work.

PHASE B — Assemble 5 templates (one-time, repeatable via script)
  For each archetype:
    Create schema tpl_{archetype}
    Copy the 21 common tables into it (structure only, no data)
    Copy that archetype's specific extension table(s) into it
  Result: 5 ready-to-clone template schemas. Never serve live traffic
  from a tpl_* schema directly.

PHASE C — Client onboarding (production, repeats per new client)
  1. Determine client's archetype (per Client_Onboarding_Guide.md)
  2. Copy the matching tpl_{archetype} schema → new schema, named per
     convention: client_{client_id}_{business_slug}
  3. Register the new schema in Supabase Exposed Schemas
     (n8n-automated — see §7, Item 1; this step is NOT automatic by
     default and must not be left manual)
  4. Insert the client's row into control.clients + control.client_config
     (including their archetype_settings JSONB)
  5. Run initial sync: control → new client schema — populates
     client_config, templates, email_categories,
     recovery_cadence_profiles with real starting values
  6. Apply RLS policies to the new schema (default-deny, per §6)
  7. Connect n8n workflows to the new schema — parameterized by schema
     name, never hardcoded per client (see §7, Item 2)
```

---

## 3. CONTROL Schema — Full Table Definitions

### `control.clients`
```
client_id             | uuid (PK)
business_name           | text
status                     | enum (active/paused/onboarding/offboarded)
billing_tier                 | text
archetype                       | enum (emergency/commerce/appointment/consultation/engagement)
secondary_archetypes                | array of enum, nullable
client_schema_name                     | text     | e.g. "client_042_acme_bakery"
created_date                              | date
```

### `control.client_active_modules`
```
client_id              | uuid (FK → clients)
module_name               | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
enabled                      | boolean
```

### `control.client_config`
```
client_id                          | uuid (FK → clients, PK)

— GLOBAL fields (one value per client, no archetype variance) —
language_mode                          | enum (fixed/adaptive)
language_list                             | array of text
default_country_code                         | text
max_booking_horizon                             | number (days)
send_window_start                                  | time
send_window_end                                       | time
after_hours_emergency_contact                            | text, nullable
reactivation_threshold_override                              | number, nullable
email_address                                                    | text
kb_email_file_id                                                    | text, nullable

— PER-ARCHETYPE settings, structured JSONB, keyed by variant —
archetype_settings                                                     | jsonb
```

**`archetype_settings` shape** (one key per archetype/sub-variant the client runs):
```json
{
  "commerce_ecom": {
    "freedom_level_override": 5,
    "conversion_mode": "A",
    "cart_value_escalation_threshold": 500,
    "backorder_notification_enabled": true
  },
  "commerce_restaurant": {
    "freedom_level_override": null,
    "conversion_mode": "A",
    "waitlist_enabled": true
  },
  "appointment": {
    "freedom_level_override": null,
    "conversion_mode": "B",
    "appointment_selfservice_link_enabled": true
  },
  "consultation": {
    "freedom_level_override": null,
    "conversion_mode": "A",
    "consultation_scoring_enabled": true,
    "realtime_high_intent_alert_enabled": true
  },
  "engagement": {
    "freedom_level_override": null,
    "conversion_mode": "A",
    "program_reactivation_notification_enabled": false
  },
  "emergency": {
    "freedom_level_override": null,
    "conversion_mode": "A"
  }
}
```
`null` in any sub-field = use archetype default. A single-archetype client has one key; a multi-archetype client (e.g., Commerce Ecom + Restaurant) has multiple keys, independently configurable. JSON shape validated at the n8n/application layer, not enforced by the database.

### `control.templates`
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
Customer-facing message content only. Fill-in-the-blank templates, not agent reasoning/logic — see `agent_prompts` below for that.

### `control.email_categories`
```
category_id             | uuid (PK)
client_id                  | uuid, nullable    | null = universal default
category_name                 | text
category_scope                   | enum (customer_facing/operational)
routing_rule                        | text
```

### `control.recovery_cadence_profiles`
```
archetype               | enum (composite PK with step_number)
step_number                | number
delay_from_previous_step      | number
delay_unit                       | enum (minutes/hours/days)
client_id                           | uuid, nullable   | null = archetype default; non-null = this client's override
```

### `control.agent_prompts`
```
prompt_id                | uuid (PK)
prompt_key                   | text        | e.g. "email_categorization_logic",
                                              "5_condition_gate_evaluation",
                                              "growth_agent_discovery_spin",
                                              "complaint_deescalation_reasoning"
module                          | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
archetype                          | enum, nullable    | null = applies across all archetypes
content                               | text             | the actual LLM instruction text
version                                  | number
status                                      | enum (stable/beta)
created_date                                   | date
promoted_to_stable_date                           | date, nullable
```
**Control-only. Never synced to any client schema.** This holds the actual behavioral intelligence — categorization logic, gate evaluation reasoning, discovery methodology — distinct from `templates`' customer-facing copy. Kept centralized for IP protection and because it sidesteps the template-propagation problem entirely (n8n reads live from the Control schema with a caching layer, so every client always runs the current version with zero migration step).

### `control.sync_log`
```
sync_id                | uuid (PK)
client_id                 | uuid (FK → clients)
table_synced                  | text
sync_timestamp                   | timestamp
status                              | enum (success/failed)
triggered_by                           | enum (schedule/manual_edit/on_read)
```

---

## 4. Common Tables (21 — identical structure in every template/client schema)

*The 4 synced tables mirror their Control schema counterpart exactly, populated by sync, never manually edited at this layer — manual editing happens in the Control schema.*

```
{schema}.client_config              — mirrors control.client_config (this client's row, flattened)
{schema}.templates                  — mirrors control.templates (defaults + this client's overrides, pre-merged)
{schema}.email_categories           — mirrors control.email_categories (universal + this client's extensions, pre-merged)
{schema}.recovery_cadence_profiles  — mirrors control.recovery_cadence_profiles (this archetype's rows only)
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
archetype                          | enum          | kept for Commerce's dual sub-variant tracking
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
lead_id                      | uuid (FK → leads, PK)     | one row per lead — final, summary-state design
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
tool_name                        | text        | per Tool_Naming_Convention.md, verb-entity format
calling_module                        | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
lead_id                                    | uuid, nullable
state                                          | enum (requested/waiting/success/failed/timeout)
request_payload                                    | json
response_payload                                       | json, nullable
timestamp                                                  | timestamp
```

---

## 5. Archetype-Specific Tables

### `conversions_emergency` (tpl_emergency only)
```
conversion_id             | uuid (FK → conversions, PK)
location                      | text
dispatch_window                   | text
team_availability_confirmed           | boolean
```

### `conversions_ecom` (tpl_commerce only)
```
conversion_id             | uuid (FK → conversions, PK)
items                         | json
quantity                          | number
cart_value                            | number
delivery_details                          | text, nullable
```

### `conversions_restaurant` (tpl_commerce only)
```
conversion_id             | uuid (FK → conversions, PK)
party_size                    | number
reservation_time                  | timestamp
table_confirmed                       | boolean
special_request                           | text, nullable
```

### `conversions_appointment` (tpl_appointment only)
```
conversion_id             | uuid (FK → conversions, PK)
service_type                  | text
practitioner                      | text, nullable
appointment_time                      | timestamp
special_request                           | text, nullable
```

### `conversions_consultation` (tpl_consultation only)
```
conversion_id             | uuid (FK → conversions, PK)
score                         | number
score_tier                        | enum (nurture/scored_booking/priority)
```

### `conversions_engagement` (tpl_engagement only)
```
conversion_id             | uuid (FK → conversions, PK)
contribution_type             | enum (donate/volunteer/attend)
program_reference                 | text, nullable
tribute_name                          | text, nullable
```

---

## 6. ⚠️ Production Awareness Notes

*(Operational realities to actively watch for once this is live.)*

1. **Template Update Propagation is NOT automatic.** Improving a `tpl_{archetype}` schema after clients are already copied from it does not retroactively update those live client schemas. No migration process is designed yet for `templates`, `email_categories`, or `recovery_cadence_profiles` (the 3 synced-but-copied tables). `agent_prompts` sidesteps this entirely by design (never copied). Revisit this once multiple clients exist and the pain becomes concrete rather than theoretical.

2. **No cross-schema foreign keys, anywhere.** Every FK in this document is within its own schema. `client_id` in a local `client_config` copy is a plain value, not an enforced FK back to `control.clients` — enforcement is a sync-time logic responsibility, not a database constraint.

3. **RLS is the real security boundary, not schema separation alone.** Default-deny for `anon`/`authenticated` on every table in every schema (the Control schema and every client schema). Only `service_role` (used by n8n) has access. This is correct and sufficient today because no client-facing app exists yet using the `authenticated` role — if one is built later, granular per-role RLS policies become necessary at that point, not before.

4. **Backups are a whole-project concern**, not just the Control schema. Supabase free tier has zero automated backups. Apply the documented GitHub-Actions + Cloudflare-R2 scheduled `pg_dump` pattern across the entire database (Control schema + every client schema) before meaningful client data accumulates.

5. **Exposed Schemas is manual by default.** A newly-copied client schema is invisible to the Data API until explicitly registered. This must be automated in the onboarding workflow (§7, Item 1) — it is the single most commonly-forgotten step in schema-per-tenant Postgres setups, confirmed across multiple independent sources during research.

6. **JSONB (`archetype_settings`) is not type-checked by the database.** A typo in a key name (e.g., `"comerce_ecom"` instead of `"commerce_ecom"`) will silently fail to apply rather than erroring — validate the shape at the n8n/application layer before writing.

7. **Voiceflow `.vf` playbooks live outside this database entirely**, by design (§8). Keep them under real version control (git, not just a dated-backup folder) for diff/rollback capability.

---

## 7. 🔧 n8n / Build Notes

*(Implementation-layer tasks the build phase must handle.)*

1. **Client onboarding workflow must include an automated "Expose Schema" API call.** Never a manual dashboard step — build it as a hard, non-skippable node in the onboarding automation, given how commonly this is forgotten in practice.

2. **Every n8n node touching a client schema selects it via `Accept-Profile`/`Content-Profile` HTTP headers**, not a hardcoded connection string per client. Parameterize workflows by schema name (read from `control.clients.client_schema_name`) so one workflow definition serves every client — this is what delivers on the "not hardcoded, database-driven" requirement in practice.

3. **Sync workflow (control → client schema)** runs on a schedule AND is triggerable on-demand, so a manual edit in the Control schema doesn't silently wait for the next scheduled run.

4. **`agent_prompts` access pattern:** n8n reads directly from `control.agent_prompts` via `service_role`, with a short-TTL cache layer to avoid hitting the Control schema on every single message. Cache invalidates on version bump.

5. **Use the transaction-mode pooler connection**, not direct connections, from all n8n workflows — direct connections are the scarcest resource on lower compute tiers, and n8n's short-lived-query execution pattern is exactly what transaction-mode pooling is designed for.

6. **Template assembly (Phase B) should be a script/workflow, not manual copying** — you'll rebuild the 5 templates whenever the common table structure changes during active build-out, before any client exists yet.

---

## 8. Design Decisions Log

*(Brief record of the non-obvious judgment calls made, for future reference.)*

- **`archetype_settings` as JSONB, not a separate table:** solves the multi-archetype-per-client case (Commerce Ecom + Restaurant needing independently different freedom levels/modes) without a second table, at the cost of losing database-level type checking on that sub-structure — mitigated at the application layer.
- **`agent_prompts` never synced, unlike `templates`:** deliberate IP-protection choice, with the side benefit of eliminating the template-propagation problem for this specific content category.
- **Voiceflow playbooks excluded from the database entirely:** direct application of the Implementation Independence principle — only platform-independent *content* (prompts, templates) belongs in the database; platform-specific *wiring* does not.
- **`growth_events`/`growth_handoff_payload` as one-row-per-lead summary state, not a full event log:** confirmed final. If a full turn-by-turn history is ever needed, this becomes a one-to-many redesign — not anticipated as needed now.
- **RLS scoped to default-deny + service_role only, not granular per-role policies:** correct for the current n8n-only access pattern; revisit if/when a client-facing app is built.

---

## 9. Final Status

```
All previously-flagged open items: RESOLVED.
  - KB storage:                     resolved (kb_entries added, v2)
  - freedom_level_override:          resolved (archetype_settings JSONB, v3)
  - conversion_mode_selection:        resolved (archetype_settings JSONB, v3)
  - Prompt/behavior-logic storage:     resolved (agent_prompts, v3)
  - Voiceflow playbook storage:         resolved (excluded by design, v3)
  - RLS / indexing / n8n auth / backups / DB validation / ENUM-vs-table:
                                          resolved (§6, §7)

Remaining, explicitly non-blocking:
  - Template propagation strategy for templates/email_categories/
    recovery_cadence_profiles — deferred until real multi-client pain
    surfaces (§6, Item 1)
  - .vf backup folder → git migration — process improvement, any time

STATUS: READY FOR SQL MIGRATION.
```

---

## 10. Total Table Count

```
CONTROL:                      8 tables
EACH ARCHETYPE TEMPLATE:
  Common tables:               21  (identical structure, every template)
  Archetype-specific:           1  (Emergency/Appointment/Consultation/Engagement)
                                 2  (Commerce — Ecom + Restaurant)

TOTAL DISTINCT TABLE STRUCTURES DESIGNED: 8 + 21 + 6 = 35
```
