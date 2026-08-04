# Database Structure — Full Plaintext Draft
### Phase 2 of 2: Table-by-Table, Column-by-Column

```
Status: Draft for review. Plaintext structure only — no SQL/migration
syntax yet. That comes after this is approved.
Confirmed decisions applied: flexible templates table, own complaints
table, core + archetype-extension conversions tables.
Every table cites the runtime doc section it traces back to.
```

---

## Notation

```
TABLE_NAME
  column_name          | type (conceptual)     | notes
  ...
  → relationships (foreign keys)
  Source: [runtime doc section]
```

Types are conceptual (text / number / boolean / date / timestamp / enum / json), not final Postgres types — that's a Phase 3 (SQL migration) decision.

---

# VAULT — Central Control Database

One row per client throughout. This is the manually-editable "source of truth" vault.

---

### `clients`
```
client_id             | uuid (PK)
business_name          | text
status                 | enum (active/paused/onboarding/offboarded)
billing_tier            | text
created_date            | date
primary_archetype       | enum (emergency/commerce/appointment/consultation/engagement)
secondary_archetypes    | array of enum, nullable    | e.g. a restaurant that also does delivery (Ecom)
```
Source: New — no equivalent in old docs, which had no client-registry concept at all.

---

### `client_active_modules`
```
client_id              | uuid (FK → clients)
module_name             | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
enabled                 | boolean
```
One row per module per client (join table, not a JSON blob) — makes "show me every client with Recovery Engine OFF" a simple query.
Source: Step 1C.0 Runtime Configuration Resolver — `active_modules`.

---

### `client_config`
```
client_id                          | uuid (FK → clients, PK)
freedom_level_override               | number, nullable       | Step 2 §2.1 — overrides archetype default if set
language_mode                        | enum (fixed/adaptive)
language_list                        | array of text
default_country_code                 | text                   | or "ASK" for multi-region
max_booking_horizon                  | number (days)
send_window_start                    | time
send_window_end                      | time
after_hours_emergency_contact        | text, nullable
cart_value_escalation_threshold      | number, nullable       | Commerce Ecom
backorder_notification_enabled       | boolean, nullable      | Commerce Ecom
waitlist_enabled                     | boolean, nullable      | Commerce Restaurant
appointment_selfservice_link_enabled | boolean, nullable      | Appointment
consultation_scoring_enabled         | boolean, nullable      | Consultation
realtime_high_intent_alert_enabled   | boolean, nullable      | Consultation
program_reactivation_notification_enabled | boolean, nullable | Engagement
reactivation_threshold_override      | number, nullable       | overrides archetype default dormancy window
email_address                        | text                   | inbound routing (confirmed from old docs, still needed)
kb_email_file_id                     | text, nullable         | if KB source is external doc, not DB-native
```
Source: consolidated from Appendix A across every batch + archetype build.

---

### `client_conversion_modes`
```
client_id              | uuid (FK → clients)
archetype                | enum
active_mode              | enum (A/B/C, per Universal Mode Naming — Agentic Completion / Assisted Capture-Guided External / Human Handoff)
mode_b_subtype           | enum (assisted_capture/guided_external), nullable   | only relevant when active_mode = B
```
One row per archetype the client uses (a client may run multiple archetypes with different modes each).
Source: Module 3 §2, Batch 3 Universal Mode Naming.

---

### `templates`
```
template_id            | uuid (PK)
client_id                | uuid (FK → clients), nullable   | null = archetype-level default, not yet personalized
template_key              | text                            | e.g. "recovery_step1", "escalation_priority1_handoff"
template_type              | enum (greeting/recovery_message/escalation_message/booking_confirmation/nurture_message/other)
archetype                  | enum, nullable
language                   | text
content                    | text                            | the actual message, with {variable} placeholders
version                    | number
active                     | boolean
created_date                | date
```
Confirmed decision: one flexible table, not per-type tables. `client_id = null` rows are archetype-level defaults every client inherits unless they have their own override row for the same `template_key`.
Source: New requirement (this session) — no old-doc equivalent, everything was hardcoded in Voiceflow/n8n previously.

---

### `sync_log`
```
sync_id                | uuid (PK)
client_id                | uuid (FK → clients)
table_synced              | text
sync_timestamp            | timestamp
status                    | enum (success/failed)
triggered_by               | enum (schedule/manual_edit/on_read)
```
Source: New — supports the "vault stays safe, client DB syncs from it" model you specified.

---

# CLIENT DATABASE — Per-Client Template (copied per client)

---

## Universal / Identity Layer (cross-cutting, read/written by every module)

---

### `customers`
```
customer_id             | uuid (PK)
primary_contact_method    | text                              | email or phone, whichever captured first
session_state              | enum (new/returning_lead/existing_customer/dormant)
last_conversion_date        | date, nullable                   | drives dormant-state calculation
created_date                 | date
```
Source: Step 1A. Deliberately thin — this is the identity anchor, not where lead/conversation content lives.

---

### `channel_identity_links`
```
link_id                 | uuid (PK)
customer_id                | uuid (FK → customers)
channel_type                | enum (email/phone/whatsapp/chat_session/sms)
channel_value                | text
match_confidence              | enum (verified/probable/weak)
linked_date                    | date
```
Multiple rows per customer — one per channel identifier known to belong to them.
Source: Module 5 §2.7 Channel Identity Resolution.

---

### `customer_preferences`
```
preference_id            | uuid (PK)
customer_id                 | uuid (FK → customers)
preference_type               | text          | e.g. "appointment_time_preference"
preference_value                | text
source                            | enum (explicit_statement/completed_action)
created_date                       | date
last_confirmed                      | date, nullable
```
Structured Level 2 memory — replaces the old "just put it in AI Summary free text" approach, per Batch 3's explicit flag that this needed a real field.
Source: Step 0C §3.2 Memory Creation Rules; Appendix A `customer_preferences`.

---

### `active_issues`
```
issue_id                 | uuid (PK)
customer_id                 | uuid (FK → customers)
current_owner                  | enum (human/live_conversation/email_manager/recovery_engine/automation/none)
issue_reference_type              | enum (lead/complaint/escalation/conversion), nullable
issue_reference_id                  | uuid, nullable
since_timestamp                       | timestamp
```
One active row per customer at a time — this is the literal implementation of the Global Active Issue Lock.
Source: Module 5 §2.9; Step 1.H.

---

### `leads`
*(Core conversation/engagement record — closest ancestor to old docs' `Leads` table, substantially extended)*
```
lead_id                  | uuid (PK)
customer_id                 | uuid (FK → customers)
archetype                      | enum
intent                            | text
source_channel                      | enum (website/whatsapp/instagram/facebook/email/sms)
conversation_summary                  | text
lead_score                              | number, nullable       | Consultation only
status                                    | enum (new/active/qualified/booked/closed/escalated)
recovery_profile                            | enum, nullable
validation_flag                              | boolean               | Step 0B §7.4
validation_notes                               | text, nullable
created_date                                     | date
last_interaction                                    | date
```
Source: Old docs' Leads table (confirmed base) + Step 0B §7.4 validation fields.

---

## Module 1 — Core Agent

---

### `complaints`
*(Confirmed decision: own table)*
```
complaint_id              | uuid (PK)
lead_id                       | uuid (FK → leads), nullable
customer_id                      | uuid (FK → customers)
issue_description                    | text
distributive_addressed                  | boolean       | Tax/Brown/Chandrashekaran justice dimensions
procedural_addressed                       | boolean
interactional_addressed                       | boolean
resolution                                       | text, nullable
proportionate_remedy_applied                        | boolean
escalated                                              | boolean
created_date                                             | date
resolved_date                                               | date, nullable
```
Source: Module 1 §C; Phase 2/3 research amendment P-029, P-033.

---

## Module 2 — Growth Agent

---

### `growth_events`
```
lead_id                    | uuid (FK → leads, PK)     | one summary row per lead
buying_stage                    | enum (explorer/evaluator/ready_buyer)
recommended_solution                 | text, nullable
recommendation_reason                    | text, nullable
objection_type                              | enum (price/trust/timing/confusion/competitor), nullable
objection_resolved                              | boolean, nullable
upsell_offered                                     | boolean
upsell_accepted                                       | boolean, nullable
growth_exit_type                                          | enum (handoff_to_conversion/abandoned/recovery_candidate/no_suitable_match)
```
Source: Module 2 §4 (renamed from "Revenue Event Tracking").

---

### `growth_handoff_payload`
```
lead_id                    | uuid (FK → leads, PK)
selected_solution               | text, nullable
resolved_objections                 | text (json array), nullable
pending_questions                       | text (json array), nullable
captured_contact_fields                    | text (json), nullable
```
Source: Module 2 §3 — the structured handoff to Conversion Engine.

---

## Module 3 — Conversion Engine

*(Confirmed decision: core table + archetype-specific extension tables)*

---

### `conversions` (core)
```
conversion_id              | uuid (PK)
lead_id                        | uuid (FK → leads)
archetype                          | enum
conversion_mode                       | enum (A/B/C)
conversion_state                          | enum (intent_confirmed/data_collection/action_pending/confirmed/failed_recoverable/failed_escalation/cancelled)
source_module                                 | enum (growth_agent/direct)
required_fields_status                             | enum (all_collected/partial/none)
external_action_status                                 | enum (success/failed_recoverable/failed_escalation/not_attempted)
failure_reason                                             | text, nullable
final_state                                                    | enum
recovery_eligible                                                | boolean
calendar_event_id                                                   | text, nullable    | confirmed real integration need from old docs
created_date                                                            | date
confirmed_date                                                              | date, nullable
```
Source: Module 3 §1.1, §5.1, §5.2.

---

### `conversions_ecom` (extension)
```
conversion_id            | uuid (FK → conversions, PK)
items                        | text (json)
quantity                        | number
cart_value                          | number
delivery_details                        | text, nullable
```
### `conversions_restaurant` (extension)
```
conversion_id            | uuid (FK → conversions, PK)
party_size                    | number
reservation_time                  | timestamp
table_confirmed                       | boolean
special_request                          | text, nullable
```
### `conversions_appointment` (extension)
```
conversion_id            | uuid (FK → conversions, PK)
service_type                  | text
practitioner                      | text, nullable
appointment_time                      | timestamp
special_request                           | text, nullable
```
### `conversions_consultation` (extension)
```
conversion_id            | uuid (FK → conversions, PK)
score                        | number
score_tier                       | enum (nurture/scored_booking/priority)
```
### `conversions_emergency` (extension)
```
conversion_id            | uuid (FK → conversions, PK)
location                      | text
dispatch_window                   | text
team_availability_confirmed           | boolean
```
### `conversions_engagement` (extension)
```
conversion_id            | uuid (FK → conversions, PK)
contribution_type             | enum (donate/volunteer/attend)
program_reference                 | text, nullable
tribute_name                          | text, nullable    | gift/tribute donation case
```
Source (all 6 extensions): Module 3 §3, per-archetype flows.

---

## Module 4 — Recovery Engine

---

### `recovery_cadence_profiles`
```
archetype                | enum (PK, composite with step_number)
step_number                  | number
delay_from_previous_step        | number
delay_unit                          | enum (minutes/hours/days)
```
**Config-driven, not hardcoded** — this is the direct fix for the old docs' business-name-hardcoded cadence logic. Global defaults live here; a client-specific override could live in a parallel Vault-level table if ever needed, but starting with archetype-level defaults only.
Source: Module 4 §3, corrected against old docs' WF-101–104 hardcoding.

---

### `recovery_queue`
```
recovery_id                | uuid (PK)
lead_id                        | uuid (FK → leads)
conversion_id                      | uuid (FK → conversions), nullable
recovery_source                        | enum (A through I, per Module 4 §8)
recovery_profile                           | enum
current_step                                   | number
status                                             | enum (active/paused/completed/stopped)   [NOT "failed" — explicitly rejected]
next_follow_up                                        | timestamp
last_attempt_date                                         | date, nullable
attempt_count                                                  | number
human_ownership_flag                                              | boolean
recovery_context                                                      | text (json)
created_date                                                              | date
```
Source: Module 4 general + §6 (status values, explicitly correcting old docs' "Failed" value) + §7.1.

---

### `suppression_records`
```
suppression_id             | uuid (PK)
contact_method                  | text
suppression_type                    | enum (opt_out/spam_complaint)
channel_scope                           | enum (all/email/sms/whatsapp)
lead_id                                     | uuid (FK → leads), nullable   | nullable to support pre-record opt-out
created_date                                    | date
```
Source: Module 4 §5, including the pre-record opt-out pattern.

---

## Module 5 — Email Manager

---

### `email_categories`
```
category_id               | uuid (PK)
client_id                     | uuid, nullable     | null = universal default category, else client-specific extension
category_name                     | text
category_scope                        | enum (customer_facing/operational)
routing_rule                              | text          | which autonomy level / handling applies
```
**Config-driven, client-extensible** — direct fix for old docs' fixed Single Select category list.
Source: Module 5 §2.1, §5; Batch 3 category extensibility addition.

---

### `emails`
```
email_id                  | uuid (PK)
customer_id                   | uuid (FK → customers)
lead_id                           | uuid (FK → leads), nullable
gmail_thread_id                       | text                | confirmed real integration need
gmail_message_id                          | text
category_id                                   | uuid (FK → email_categories)
thread_lifecycle                                  | enum (open/waiting_customer/waiting_business/resolved/stale)
email_status                                          | enum (new/human_review_required/draft_ready/sent/auto_replied/escalated/closed/error)
reply_style                                               | enum (scripted/generative)
draft_content                                                 | text, nullable
sent_content                                                       | text, nullable
bounce_status                                                          | enum (delivered/bounced/spam_complaint), nullable
received_date                                                              | date
```
Source: Module 5 general + §2.3 (Thread Lifecycle kept separate from Email Status per explicit Batch 3 resolution) + Comprehensive Scan's bounce/spam addition.

---

### `attachments`
```
attachment_id             | uuid (PK)
email_id                      | uuid (FK → emails)
attachment_type                   | enum (customer_evidence/business_document/identity_payment_sensitive/recruiting/unknown)
```
Source: Module 5 §2.6.

---

### `draft_edit_log`
```
edit_id                   | uuid (PK)
email_id                      | uuid (FK → emails)
ai_draft                          | text
human_approved_version                | text
edit_category                             | enum (tone/scope/factual/escalation_violation)
timestamp                                     | date
```
Source: Module 5 §3.2 Learning Loop.

---

## Escalation (cross-cutting, referenced by Modules 1, 3, 4, 5)

---

### `escalations`
```
escalation_id              | uuid (PK)
lead_id                        | uuid (FK → leads), nullable
customer_id                        | uuid (FK → customers)
escalation_type                        | text
escalation_reason                          | text
escalation_priority                            | enum (P1_immediate/P2_standard/P3_review)
origin_module                                      | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
trigger_condition                                      | text
ownership_state                                            | enum (ai_owned/human_owned/collaborative)
status                                                          | enum (open/resolved)
created_date                                                        | date
resolved_date                                                            | date, nullable
```
Source: Module 1D Escalation Priority Classification; Appendix A escalation record fields (named but never previously implemented).

---

## System / Cross-Cutting

---

### `tool_call_log`
```
call_id                   | uuid (PK)
tool_name                     | text        | per Tool_Naming_Convention.md, verb-entity format
calling_module                    | enum (core_agent/growth_agent/conversion_engine/recovery_engine/email_manager)
lead_id                                | uuid, nullable
state                                       | enum (requested/waiting/success/failed/timeout)
request_payload                                | text (json)
response_payload                                   | text (json), nullable
timestamp                                              | timestamp
```
Generalizes old docs' WF-501 Error Logger to the full tool-call lifecycle.
Source: Step 1D.3 Action Tool Execution Contract.

---

# Summary Table Count

```
VAULT:                5 tables
CLIENT DB:
  Identity/Universal:  5 tables (customers, channel_identity_links,
                        customer_preferences, active_issues, leads)
  Core Agent:          1 table  (complaints)
  Growth Agent:        2 tables (growth_events, growth_handoff_payload)
  Conversion Engine:   7 tables (core + 6 archetype extensions)
  Recovery Engine:     3 tables
  Email Manager:       4 tables
  Escalation:          1 table
  System:              1 table
  TOTAL CLIENT DB:     24 tables
```

---

# Open Items for Your Review

1. **`growth_events` and `growth_handoff_payload` are one row per lead** (summary/terminal state), not a full event log. If you want a full turn-by-turn event history instead (every recommendation made, every objection raised, as separate rows) rather than just the final state, this needs to change to a one-to-many structure. My read of Module 2 §4's language ("records key events for analytics") could support either — flagging rather than assuming.
2. **`recovery_cadence_profiles` has no per-client override table yet** — currently assumes every client on a given archetype uses the same cadence. If you anticipate needing client-specific cadence overrides later, worth adding a `client_recovery_cadence_overrides` table now rather than retrofitting.
3. **KB content storage isn't in this draft** — the runtime doc references "Business Memory / KB" constantly but I haven't designed KB storage itself (FAQ content, policy content). This needs its own table family (likely `kb_entries: client_id | category | question | answer | language`) — did I miss this intentionally, or should it be added now?
4. Anything else that looks structurally off before we move to actual SQL.
