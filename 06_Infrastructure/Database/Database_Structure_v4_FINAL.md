# Zenny Database Structure v4 — FINAL

### Schema-Based Multi-Tenant Design (Control + `public` Reference Scaffolding + 5 Archetype Templates)

```
Status:     FINAL — reconciles the original v3 design with everything
            actually built, corrected, and verified across Phase A and
            Phase B. Verified directly against the live database via
            information_schema/pg_catalog queries, not reconstructed
            from task reports or memory. Updated 2026-08-01 to add
            migrations 012/013 (Phase C groundwork), found missing
            during that date's cross-architecture validation pass — the
            012/013 additions are transcribed from the migration files,
            not independently re-verified live against pg_catalog the
            way the rest of this document was; a live re-verification
            pass is recommended before removing this note.
Platform:   Supabase (Postgres 17), project "zenny-vault", single
            project, multiple schemas.
Supersedes: Database_Structure_v3.md (§1-§2's schema tree/build workflow
            are unchanged in intent; every table/column/constraint below
            reflects what was actually built, including 2 corrections
            and 1 addition made after v3 was frozen).
Scope:      Documents what exists in the database RIGHT NOW. Updated
            2026-08-01 to include migrations 012 (schema version
            tracking) and 013 (create_client_schema_from_template) — the
            first real pieces of Phase C client-onboarding automation,
            which has now partially started (see
            Client_Onboarding_Sequence_Spec.md for the onboarding
            sequence this groundwork supports). Phase C is not fully
            built — most of client onboarding automation remains future
            work — but "hasn't happened yet" is no longer accurate for
            the two pieces this update adds.
```

---

## 1. Schema Tree Overview

```
SUPABASE PROJECT "zenny-vault" (single project, multiple schemas)
│
├── SCHEMA: control                                    (9 tables)
│   │   ZeroManual Control Plane. Manually editable. Source of truth.
│   │   RLS: enabled, zero policies, zero anon/authenticated grants.
│   │   Only service_role (used by n8n) has access.
│   │
│   ├── TABLE: clients                        ← +2 columns, migration 012, see §3
│   ├── TABLE: client_active_modules
│   ├── TABLE: client_config
│   ├── TABLE: templates
│   ├── TABLE: email_categories
│   ├── TABLE: recovery_cadence_profiles      ← corrected structure, see §3
│   ├── TABLE: agent_prompts                  ← never synced to any client schema
│   ├── TABLE: sync_log
│   └── TABLE: template_versions              ← added migration 012, see §3
│
├── SCHEMA: public                                     (27 tables: 21 common + 6 archetype-specific)
│   │   PERMANENT REFERENCE SCAFFOLDING. Not a template, not a client
│   │   schema, never receives real application traffic. Holds the
│   │   canonical structures Phase B copies FROM to build each tpl_*
│   │   schema. RLS enabled, zero policies, zero anon/authenticated
│   │   grants (including the postgres-role default ACL for future
│   │   tables — closed in migration 008). One unrelated stray table,
│   │   `public.test` (0 rows, not part of this design), also RLS-
│   │   enabled with 0 policies but out of scope for this document.
│   │
│   ├── [21 COMMON TABLES — see §4, identical structure everywhere]
│   └── [6 ARCHETYPE-SPECIFIC TABLES — see §5]
│       ├── conversions_emergency
│       ├── conversions_ecom
│       ├── conversions_restaurant
│       ├── conversions_appointment
│       ├── conversions_consultation
│       └── conversions_engagement
│
├── SCHEMA: tpl_emergency        (22 tables: 21 common + conversions_emergency)
├── SCHEMA: tpl_commerce         (23 tables: 21 common + conversions_ecom + conversions_restaurant)
├── SCHEMA: tpl_appointment      (22 tables: 21 common + conversions_appointment)
├── SCHEMA: tpl_consultation     (22 tables: 21 common + conversions_consultation)
└── SCHEMA: tpl_engagement       (22 tables: 21 common + conversions_engagement)

    Each is a BUILD-PHASE TEMPLATE, not a live client — assembled by
    public.create_archetype_template() (§8), which copies public's 21
    common tables + the archetype's own specific table(s), re-adds every
    FK to point within the new schema (LIKE does not copy FKs — see §8),
    enables RLS explicitly, and applies the same zero-grant posture.
    Structure only, no data. Never serve live traffic from a tpl_*
    schema directly.

────────────────────────────────────────────────────────────

AT CLIENT ONBOARDING (Phase C — not yet built):

  tpl_commerce  --[copy schema]-->  client_042_acme_bakery

  Live client schemas will be COPIES of the correct template — fully
  independent after copying. Not part of this document's scope.
```

**Confirmed table counts** (verified via `information_schema.tables`, live database):

| Schema | Table count |
|---|---|
| `control` | 9 (updated 2026-08-01, migration 012 — `template_versions` added) |
| `public` | 27 (+1 unrelated `test` table) |
| `tpl_emergency` | 22 |
| `tpl_commerce` | 23 |
| `tpl_appointment` | 22 |
| `tpl_consultation` | 22 |
| `tpl_engagement` | 22 |
| **Total (this design)** | **147** |

---

## 2. Build & Deployment Workflow

```
PHASE A — Build once (COMPLETE)
  Created the control schema (8 tables), all 42 enum types, and the 21
  common + 6 archetype-specific reference table structures in public.

PHASE B — Assemble 5 templates (COMPLETE)
  public.create_archetype_template(archetype, specific_tables[]) built
  and invoked once per archetype. Result: 5 ready-to-clone template
  schemas, each independently verified (table count, FK resolution,
  RLS, grants — see §8).

PHASE C — Client onboarding (STARTED, NOT COMPLETE — updated 2026-08-01)
  Part 1 (migration 012): schema version tracking added — control.
  clients.template_version / .template_archetype_at_onboarding, and the
  new control.template_versions table (see §3).
  Part 2 (migration 013): public.create_client_schema_from_template()
  built — copies a tpl_{archetype} template into an arbitrary client
  schema name (see §8.5). Tested end-to-end against one throwaway client
  (client_test_001_acme_emergency_test) — see Client_Onboarding_
  Sequence_Spec.md for the full onboarding sequence and results.
  Remaining onboarding automation (control.clients row creation,
  archetype_settings population, Data API schema exposure registration,
  client-facing credential/config collection) is not yet built.
```

---

## 3. `control` Schema — Full Table Definitions

### `control.clients`
```
client_id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_name                      text NOT NULL
status                             client_status_enum NOT NULL
billing_tier                       text NOT NULL
archetype                          archetype_enum NOT NULL
secondary_archetypes               archetype_enum[], nullable
client_schema_name                 text NOT NULL
created_date                       date NOT NULL
template_version                   int NOT NULL DEFAULT 1
template_archetype_at_onboarding   archetype_enum, nullable
```
`template_version` and `template_archetype_at_onboarding` added by migration `012_schema_version_tracking.sql` (Phase C, Part 1) — lets `control.clients.template_version` tell you, per client, whether they're on the current `tpl_{archetype}` structure or need `Template_Migration_Process.md`'s manual migration applied.

### `control.template_versions`
```
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
archetype             archetype_enum NOT NULL
version               int NOT NULL
change_description    text NOT NULL
applied_to_public     boolean NOT NULL DEFAULT true
created_date          date NOT NULL DEFAULT current_date
CONSTRAINT template_versions_unique UNIQUE (archetype, version)
```
Added by migration `012_schema_version_tracking.sql`. A version log for the `tpl_*` templates themselves, seeded with one row per `archetype_enum` value at version 1 ("Initial Phase A/B build") — including `commerce_ecom` and `commerce_restaurant` as independent peer rows, since the enum has no bare `'commerce'` value, even though both share the single `tpl_commerce` schema and will always version together in practice.

### `control.client_active_modules`
```
client_id     uuid NOT NULL REFERENCES control.clients(client_id)
module_name   module_name_enum NOT NULL
enabled       boolean NOT NULL
PRIMARY KEY (client_id, module_name)
```
No PK was specified in the original v3 design for this table — a composite PK of `(client_id, module_name)` was added as the minimal, non-invasive interpretation (one row per client per module).

### `control.client_config`
```
client_id                          uuid PRIMARY KEY REFERENCES control.clients(client_id)
language_mode                      language_mode_enum NOT NULL
language_list                      text[] NOT NULL
default_country_code               text NOT NULL
max_booking_horizon                integer NOT NULL, CHECK (>= 0)
send_window_start                  time NOT NULL
send_window_end                    time NOT NULL
after_hours_emergency_contact      text, nullable
reactivation_threshold_override    integer, nullable, CHECK (IS NULL OR >= 0)
email_address                      text NOT NULL, CHECK (valid email format)
kb_email_file_id                   text, nullable
archetype_settings                 jsonb NOT NULL
```
`archetype_settings` shape is JSON, keyed by archetype/sub-variant (`commerce_ecom`, `commerce_restaurant`, `appointment`, `consultation`, `engagement`, `emergency`). Not validated at the database level — application-layer (n8n) responsibility, by explicit design.

### `control.templates`
```
template_id     uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       uuid REFERENCES control.clients(client_id), nullable  (null = archetype-level default)
template_key    text NOT NULL
template_type   template_type_enum NOT NULL
archetype       archetype_enum, nullable
language        text NOT NULL
content         text NOT NULL
version         integer NOT NULL, CHECK (>= 1)
active          boolean NOT NULL
created_date    date NOT NULL
```

### `control.email_categories`
```
category_id     uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       uuid REFERENCES control.clients(client_id), nullable  (null = universal default)
category_name   text NOT NULL
category_scope  category_scope_enum NOT NULL
routing_rule    text NOT NULL
```
**Correction applied post-v3**: `client_id` now carries an explicit FK to `control.clients` (v3's original spec omitted the FK annotation here, inconsistently with `templates.client_id`, which had one). Indexed (`idx_control_email_categories_client_id`).

### `control.recovery_cadence_profiles`
```
id                         uuid PRIMARY KEY DEFAULT gen_random_uuid()
archetype                  archetype_enum NOT NULL
step_number                integer NOT NULL, CHECK (>= 1)
delay_from_previous_step   integer NOT NULL, CHECK (>= 0)
delay_unit                 delay_unit_enum NOT NULL
client_id                  uuid REFERENCES control.clients(client_id), nullable
CONSTRAINT recovery_cadence_client_override_unique UNIQUE (archetype, step_number, client_id)
CONSTRAINT recovery_cadence_default_unique UNIQUE INDEX ON (archetype, step_number) WHERE client_id IS NULL
```
**Correction applied post-v3**: v3's original spec used a literal 2-column PK `(archetype, step_number)`, which could not represent both an archetype-default row and per-client override rows for the same step — Postgres would allow only one row total per step across the entire table. Replaced with a surrogate `id` PK, a `UNIQUE(archetype, step_number, client_id)` constraint (at most one override row per client per step), and a partial unique index on `(archetype, step_number) WHERE client_id IS NULL` (exactly one default row per step — a plain `UNIQUE` constraint cannot enforce this, since Postgres treats every `NULL` as distinct). `client_id` also now carries an explicit FK. Indexed (`idx_control_recovery_cadence_profiles_client_id`).

### `control.agent_prompts`
```
prompt_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
prompt_key                 text NOT NULL
module                     module_name_enum NOT NULL
archetype                  archetype_enum, nullable  (null = applies across all archetypes)
content                    text NOT NULL
version                    integer NOT NULL, CHECK (>= 1)
status                     prompt_status_enum NOT NULL
created_date                date NOT NULL
promoted_to_stable_date     date, nullable
```
Control-only. Never synced to any client schema, by design.

### `control.sync_log`
```
sync_id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       uuid NOT NULL REFERENCES control.clients(client_id)
table_synced    text NOT NULL
sync_timestamp  timestamptz NOT NULL
status          sync_status_enum NOT NULL
triggered_by    sync_trigger_enum NOT NULL
```
Indexed (`idx_control_sync_log_client_id`).

---

## 4. Common Tables (21 — verified byte-identical in `public` and all 5 `tpl_*` schemas)

Verified directly: a column-signature comparison (name, data type, UDT, nullability) was run across `public` + all 5 `tpl_*` schemas for every one of these 21 tables. Every signature matched exactly. Documented once below.

The first 4 mirror their `control.*` counterpart's structure. `client_config`, `templates`, `email_categories` carry no local FK (no local `clients` table exists in these schemas). `recovery_cadence_profiles`'s local copy is deliberately simplified — see below.

### `client_config`
```
client_id                          uuid PRIMARY KEY DEFAULT gen_random_uuid()
language_mode                      language_mode_enum NOT NULL
language_list                      text[] NOT NULL
default_country_code               text NOT NULL
max_booking_horizon                integer NOT NULL, CHECK (>= 0)
send_window_start                  time NOT NULL
send_window_end                    time NOT NULL
after_hours_emergency_contact      text, nullable
reactivation_threshold_override    integer, nullable, CHECK (IS NULL OR >= 0)
email_address                      text NOT NULL, CHECK (valid email format)
kb_email_file_id                   text, nullable
archetype_settings                 jsonb NOT NULL
```

### `templates`
```
template_id     uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       uuid, nullable
template_key    text NOT NULL
template_type   template_type_enum NOT NULL
archetype       archetype_enum, nullable
language        text NOT NULL
content         text NOT NULL
version         integer NOT NULL, CHECK (>= 1)
active          boolean NOT NULL
created_date    date NOT NULL
```

### `email_categories`
```
category_id     uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       uuid, nullable
category_name   text NOT NULL
category_scope  category_scope_enum NOT NULL
routing_rule    text NOT NULL
```

### `recovery_cadence_profiles` (local, simplified)
```
id                         uuid PRIMARY KEY DEFAULT gen_random_uuid()
archetype                  archetype_enum NOT NULL
step_number                integer NOT NULL, CHECK (>= 1)
delay_from_previous_step   integer NOT NULL, CHECK (>= 0)
delay_unit                 delay_unit_enum NOT NULL
CONSTRAINT recovery_cadence_local_unique UNIQUE (archetype, step_number)
```
No `client_id` and no override machinery here — by the time this table is synced into one specific client's schema (Phase C), the default-vs-override merge has already happened upstream. This table holds the one resolved row per archetype+step for that client. Resolving default-vs-override is a Phase C (sync workflow) responsibility.

### `kb_entries`
```
entry_id    uuid PRIMARY KEY DEFAULT gen_random_uuid()
category    text NOT NULL
question    text NOT NULL
answer      text NOT NULL
language    text NOT NULL
active      boolean NOT NULL
```

### `customers`
```
customer_id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
primary_contact_method  text NOT NULL
session_state           session_state_enum NOT NULL
last_conversion_date    date, nullable
created_date            date NOT NULL
```
Indexed on `primary_contact_method`.

### `channel_identity_links`
```
link_id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id        uuid NOT NULL REFERENCES customers(customer_id)
channel_type       channel_type_enum NOT NULL
channel_value      text NOT NULL
match_confidence   match_confidence_enum NOT NULL
linked_date        date NOT NULL
```
Indexed on `customer_id`.

### `customer_preferences`
```
preference_id     uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id       uuid NOT NULL REFERENCES customers(customer_id)
preference_type   text NOT NULL
preference_value  text NOT NULL
source            preference_source_enum NOT NULL
created_date      date NOT NULL
last_confirmed    date, nullable
```
Indexed on `customer_id`.

### `active_issues`
```
issue_id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id            uuid NOT NULL REFERENCES customers(customer_id)
current_owner          issue_owner_enum NOT NULL
issue_reference_type   issue_reference_type_enum, nullable
issue_reference_id     uuid, nullable
since_timestamp        timestamptz NOT NULL
```
Indexed on `customer_id`.

### `leads`
```
lead_id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id            uuid NOT NULL REFERENCES customers(customer_id)
archetype               archetype_enum NOT NULL
intent                    text NOT NULL
source_channel             source_channel_enum NOT NULL
conversation_summary        text NOT NULL
lead_score                   integer, nullable, CHECK (IS NULL OR >= 0)
status                        lead_status_enum NOT NULL
recovery_profile              text, nullable
validation_flag                 boolean NOT NULL
validation_notes                  text, nullable
created_date                       date NOT NULL
last_interaction                     date NOT NULL
```
Indexed on `customer_id`, `status`, `created_date`.

`recovery_profile` is kept as plain `text`, not an enum: the original v3 design typed it "enum, nullable" but never listed a value set anywhere in the source document (unlike every other enum column). No values were invented — this remains an open item for the architect.

### `complaints`
```
complaint_id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
lead_id                         uuid REFERENCES leads(lead_id), nullable
customer_id                     uuid NOT NULL REFERENCES customers(customer_id)
issue_description                text NOT NULL
distributive_addressed           boolean NOT NULL
procedural_addressed             boolean NOT NULL
interactional_addressed          boolean NOT NULL
resolution                       text, nullable
proportionate_remedy_applied     boolean NOT NULL
escalated                        boolean NOT NULL
created_date                     date NOT NULL
resolved_date                    date, nullable
```
Indexed on `lead_id`, `customer_id`.

### `growth_events` (one row per lead — summary state, not an event log)
```
lead_id                 uuid PRIMARY KEY REFERENCES leads(lead_id)
buying_stage            buying_stage_enum NOT NULL
recommended_solution    text, nullable
recommendation_reason   text, nullable
objection_type          objection_type_enum, nullable
objection_resolved      boolean, nullable
upsell_offered          boolean NOT NULL
upsell_accepted         boolean, nullable
growth_exit_type        growth_exit_type_enum NOT NULL
```

### `growth_handoff_payload`
```
lead_id                    uuid PRIMARY KEY REFERENCES leads(lead_id)
selected_solution          text, nullable
resolved_objections        json, nullable
pending_questions          json, nullable
captured_contact_fields    json, nullable
```

### `conversions` (core)
```
conversion_id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
lead_id                     uuid NOT NULL REFERENCES leads(lead_id)
conversion_mode             conversion_mode_enum NOT NULL
conversion_state            conversion_state_enum NOT NULL
source_module               source_module_enum NOT NULL
required_fields_status      required_fields_status_enum NOT NULL
external_action_status      external_action_status_enum NOT NULL
failure_reason               text, nullable
final_state                  conversion_state_enum NOT NULL
recovery_eligible            boolean NOT NULL
calendar_event_id            text, nullable
created_date                 date NOT NULL
confirmed_date                date, nullable
```
Indexed on `lead_id`. `final_state` reuses `conversion_state_enum` — its value set was undocumented in v3; reusing the enum for the terminal-state column was judged the safer choice over inventing an undocumented type.

### `recovery_queue`
```
recovery_id             uuid PRIMARY KEY DEFAULT gen_random_uuid()
lead_id                 uuid NOT NULL REFERENCES leads(lead_id)
conversion_id           uuid REFERENCES conversions(conversion_id), nullable
recovery_source         recovery_source_enum NOT NULL
current_step            integer NOT NULL, CHECK (>= 0)
status                  recovery_status_enum NOT NULL   (never 'failed')
next_follow_up          timestamptz NOT NULL
last_attempt_date       date, nullable
attempt_count           integer NOT NULL, CHECK (>= 0)
human_ownership_flag    boolean NOT NULL
recovery_context        json NOT NULL
created_date              date NOT NULL
```
Indexed on `lead_id`, `conversion_id`, `next_follow_up`.

### `suppression_records`
```
suppression_id      uuid PRIMARY KEY DEFAULT gen_random_uuid()
contact_method       text NOT NULL
suppression_type     suppression_type_enum NOT NULL
channel_scope        channel_scope_enum NOT NULL
lead_id              uuid REFERENCES leads(lead_id), nullable
created_date         date NOT NULL
```
Indexed on `lead_id`.

### `emails`
```
email_id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
customer_id         uuid NOT NULL REFERENCES customers(customer_id)
lead_id             uuid REFERENCES leads(lead_id), nullable
gmail_thread_id     text NOT NULL
gmail_message_id    text NOT NULL
category_id         uuid NOT NULL REFERENCES email_categories(category_id)
thread_lifecycle    thread_lifecycle_enum NOT NULL
email_status        email_status_enum NOT NULL
reply_style         reply_style_enum NOT NULL
draft_content       text, nullable
sent_content        text, nullable
bounce_status       bounce_status_enum, nullable
received_date       date NOT NULL
```
Indexed on `customer_id`, `lead_id`, `category_id`, `thread_lifecycle`.

### `attachments`
```
attachment_id      uuid PRIMARY KEY DEFAULT gen_random_uuid()
email_id           uuid NOT NULL REFERENCES emails(email_id)
attachment_type    attachment_type_enum NOT NULL
```
Indexed on `email_id`.

### `draft_edit_log`
```
edit_id                   uuid PRIMARY KEY DEFAULT gen_random_uuid()
email_id                  uuid NOT NULL REFERENCES emails(email_id)
ai_draft                  text NOT NULL
human_approved_version    text NOT NULL
edit_category              edit_category_enum NOT NULL
"timestamp"                    date NOT NULL
```
Indexed on `email_id`. The `"timestamp"` column (quoted — reserved word) is typed `date`, not `timestamptz`, despite its name — this is v3's own literal type annotation for this one column, kept as documented; a likely source-document inconsistency worth revisiting.

### `escalations`
```
escalation_id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
lead_id               uuid REFERENCES leads(lead_id), nullable
customer_id           uuid NOT NULL REFERENCES customers(customer_id)
escalation_type       text NOT NULL
escalation_reason     text NOT NULL
escalation_priority   escalation_priority_enum NOT NULL
origin_module         module_name_enum NOT NULL
trigger_condition     text NOT NULL
ownership_state       ownership_state_enum NOT NULL
status                escalation_status_enum NOT NULL
created_date          date NOT NULL
resolved_date         date, nullable
```
Indexed on `lead_id`, `customer_id`.

### `tool_call_log`
```
call_id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
tool_name            text NOT NULL
calling_module       module_name_enum NOT NULL
lead_id              uuid, nullable   (no FK — not annotated as one in v3)
state                tool_call_state_enum NOT NULL
request_payload      json NOT NULL
response_payload     json, nullable
"timestamp"          timestamptz NOT NULL
```

---

## 5. Archetype-Specific Tables (6 distinct structures)

Each has a FK on `conversion_id` to that schema's own `conversions` table — verified directly (not assumed) to resolve within-schema in every one of the 5 `tpl_*` schemas; see §8.

### `conversions_emergency` (in `public`, `tpl_emergency`)
```
conversion_id                  uuid PRIMARY KEY REFERENCES conversions(conversion_id)
location                       text NOT NULL
dispatch_window                text NOT NULL
team_availability_confirmed    boolean NOT NULL
```

### `conversions_ecom` (in `public`, `tpl_commerce`)
```
conversion_id       uuid PRIMARY KEY REFERENCES conversions(conversion_id)
items                json NOT NULL
quantity              integer NOT NULL, CHECK (> 0)
cart_value               numeric(12,2) NOT NULL, CHECK (>= 0)
delivery_details             text, nullable
```

### `conversions_restaurant` (in `public`, `tpl_commerce`)
```
conversion_id       uuid PRIMARY KEY REFERENCES conversions(conversion_id)
party_size           integer NOT NULL, CHECK (> 0)
reservation_time         timestamptz NOT NULL
table_confirmed              boolean NOT NULL
special_request                  text, nullable
```

### `conversions_appointment` (in `public`, `tpl_appointment`)
```
conversion_id     uuid PRIMARY KEY REFERENCES conversions(conversion_id)
service_type       text NOT NULL
practitioner            text, nullable
appointment_time            timestamptz NOT NULL
special_request                  text, nullable
```

### `conversions_consultation` (in `public`, `tpl_consultation`)
```
conversion_id    uuid PRIMARY KEY REFERENCES conversions(conversion_id)
score              integer NOT NULL, CHECK (>= 0)
score_tier             score_tier_enum NOT NULL
```

### `conversions_engagement` (in `public`, `tpl_engagement`)
```
conversion_id       uuid PRIMARY KEY REFERENCES conversions(conversion_id)
contribution_type    contribution_type_enum NOT NULL
program_reference        text, nullable
tribute_name                  text, nullable
```

---

## 6. Enum Types (42 total — confirmed via `pg_type`/`pg_enum`, live database)

The live database contains 54 enum types total; 12 are Supabase-platform-internal (`aal_level`, `action`, `buckettype`, `code_challenge_method`, `equality_op`, `factor_status`, `factor_type`, `oauth_authorization_status`, `oauth_client_type`, `oauth_registration_type`, `oauth_response_type`, `one_time_token_type` — auth/storage/realtime schemas, not part of this design). The remaining **42 are this project's**, all database-wide (Postgres enum types are not schema-scoped — created once in `control`-table-adjacent scope, reused everywhere without redefinition):

| Enum | Values |
|---|---|
| `client_status_enum` | active, paused, onboarding, offboarded |
| `archetype_enum` | emergency, commerce_ecom, commerce_restaurant, appointment, consultation, engagement |
| `module_name_enum` | core_agent, growth_agent, conversion_engine, recovery_engine, email_manager |
| `language_mode_enum` | fixed, adaptive |
| `template_type_enum` | greeting, recovery_message, escalation_message, booking_confirmation, nurture_message, other |
| `category_scope_enum` | customer_facing, operational |
| `delay_unit_enum` | minutes, hours, days |
| `prompt_status_enum` | stable, beta |
| `sync_status_enum` | success, failed |
| `sync_trigger_enum` | schedule, manual_edit, on_read |
| `session_state_enum` | new, returning_lead, existing_customer, dormant |
| `channel_type_enum` | email, phone, whatsapp, chat_session, sms |
| `match_confidence_enum` | verified, probable, weak |
| `preference_source_enum` | explicit_statement, completed_action |
| `issue_owner_enum` | human, live_conversation, email_manager, recovery_engine, automation, none |
| `issue_reference_type_enum` | lead, complaint, escalation, conversion |
| `source_channel_enum` | website, whatsapp, instagram, facebook, email, sms |
| `lead_status_enum` | new, active, qualified, booked, closed, escalated |
| `buying_stage_enum` | explorer, evaluator, ready_buyer |
| `objection_type_enum` | price, trust, timing, confusion, competitor |
| `growth_exit_type_enum` | handoff_to_conversion, abandoned, recovery_candidate, no_suitable_match |
| `conversion_mode_enum` | A, B, C |
| `conversion_state_enum` | intent_confirmed, data_collection, action_pending, confirmed, failed_recoverable, failed_escalation, cancelled |
| `source_module_enum` | growth_agent, direct |
| `required_fields_status_enum` | all_collected, partial, none |
| `external_action_status_enum` | success, failed_recoverable, failed_escalation, not_attempted |
| `recovery_source_enum` | A, B, C, D, E, F, G, H, I |
| `recovery_status_enum` | active, paused, completed, stopped |
| `suppression_type_enum` | opt_out, spam_complaint |
| `channel_scope_enum` | all, email, sms, whatsapp |
| `thread_lifecycle_enum` | open, waiting_customer, waiting_business, resolved, stale |
| `email_status_enum` | new, human_review_required, draft_ready, sent, auto_replied, escalated, closed, error |
| `reply_style_enum` | scripted, generative |
| `bounce_status_enum` | delivered, bounced, spam_complaint |
| `attachment_type_enum` | customer_evidence, business_document, identity_payment_sensitive, recruiting, unknown |
| `edit_category_enum` | tone, scope, factual, escalation_violation |
| `escalation_priority_enum` | P1_immediate, P2_standard, P3_review |
| `ownership_state_enum` | ai_owned, human_owned, collaborative |
| `escalation_status_enum` | open, resolved |
| `tool_call_state_enum` | requested, waiting, success, failed, timeout |
| `score_tier_enum` | nurture, scored_booking, priority |
| `contribution_type_enum` | donate, volunteer, attend |

**`archetype_enum` resolution**: Commerce is split into `commerce_ecom`/`commerce_restaurant`, not a bare `commerce` value — this satisfies `leads.archetype`'s stated purpose ("Commerce's dual sub-variant tracking") and matches `archetype_settings`' JSON keys, which already treat the two as peer keys.

---

## 7. Indexes (26 total, confirmed via `pg_indexes`)

**22 in `public`** (identical set exists in each `tpl_*` schema — carried over automatically by `LIKE ... INCLUDING ALL`, since `public`'s source tables already had them):

FK-column indexes: `channel_identity_links.customer_id`, `customer_preferences.customer_id`, `active_issues.customer_id`, `leads.customer_id`, `complaints.lead_id`, `complaints.customer_id`, `conversions.lead_id`, `recovery_queue.lead_id`, `recovery_queue.conversion_id`, `suppression_records.lead_id`, `emails.customer_id`, `emails.lead_id`, `emails.category_id`, `attachments.email_id`, `draft_edit_log.email_id`, `escalations.lead_id`, `escalations.customer_id` (17)

Explicitly-named indexes: `leads.status`, `leads.created_date`, `recovery_queue.next_follow_up`, `emails.thread_lifecycle`, `customers.primary_contact_method` (5)

**4 in `control`** (added after `get_advisors` flagged them as unindexed FKs — the original file scoping left these out, since they're control-specific, not schema-agnostic): `email_categories.client_id`, `recovery_cadence_profiles.client_id`, `sync_log.client_id`, `templates.client_id`.

Primary keys (including the composite ones and the archetype-specific tables' shared `conversion_id` PK) get an automatic unique index from Postgres and are not counted separately here.

---

## 8. `public.create_archetype_template()` — Template Assembly Function

**Security mode: `SECURITY INVOKER`** (Postgres default — confirmed via `pg_proc.prosecdef = false`). This is the correct, safe mode: the function creates schemas/tables, which requires elevated privilege the calling role may not have. Because it runs with the *caller's* privileges (not the definer's), an unprivileged role (`anon`/`authenticated`) invoking it would fail immediately at `CREATE SCHEMA`/`CREATE TABLE` — neither role has schema-creation privilege in Supabase's default role setup, so no actual mutation is possible even though `EXECUTE` is technically grantable to them (Postgres grants `EXECUTE` to `PUBLIC` by default for every new function). No `EXECUTE` revoke was needed or applied — that remediation is specific to `SECURITY DEFINER` functions, which this is not.

`search_path` is pinned to `''` (empty) — fixes a `get_advisors` security WARN (`function_search_path_mutable`). Safe because every object reference inside the function's dynamic SQL is explicitly schema-qualified (`%I.%I`); `pg_catalog` builtins (`format()`, `string_to_array()`) are always implicitly searched regardless of `search_path`.

**What it does** (signature: `create_archetype_template(p_archetype text, p_specific_tables text[]) RETURNS void`):
1. Creates schema `tpl_{p_archetype}` if it doesn't exist.
2. Copies all 21 common tables' structure from `public` via `CREATE TABLE ... (LIKE public.x INCLUDING ALL)` — carries over columns, defaults, CHECK constraints, NOT NULL, PRIMARY KEY/UNIQUE, and indexes. **Does not carry over foreign keys** — confirmed empirically, not assumed (see `Supabase_MCP_Implementation_Notes.md`).
3. Copies the archetype's specific table(s) the same way.
4. Explicitly re-adds every FK, pointed at the new schema's own tables (guarded against re-run — skips any FK whose constraint name already exists).
5. Explicitly enables RLS on every copied table (`LIKE` does not carry RLS-enabled state at all).
6. Explicitly revokes `anon`/`authenticated` privileges and sets a per-schema default-ACL guard, as defense-in-depth (empirically not required for new schemas — see implementation notes — but applied for posture parity).

Invoked once per archetype in migration `010_assemble_all_templates.sql`:
```sql
SELECT public.create_archetype_template('emergency', ARRAY['conversions_emergency']);
SELECT public.create_archetype_template('commerce', ARRAY['conversions_ecom', 'conversions_restaurant']);
SELECT public.create_archetype_template('appointment', ARRAY['conversions_appointment']);
SELECT public.create_archetype_template('consultation', ARRAY['conversions_consultation']);
SELECT public.create_archetype_template('engagement', ARRAY['conversions_engagement']);
```

Re-runnable: every step is idempotency-guarded, so rebuilding a template after `public`'s structure changes is a single function call — though note `CREATE TABLE IF NOT EXISTS` means an *already-existing* table in a `tpl_*` schema won't pick up a structural change to `public`; a changed table would need to be dropped first for a true rebuild.

---

## 8.5 `public.create_client_schema_from_template()` — Client Onboarding Function (added 2026-08-01, migration 013)

**Not a reuse of `create_archetype_template` (§8)** — that function hardcodes the source schema as the literal string `'public'` and derives the target schema name as `'tpl_' || p_archetype`. Client onboarding needs an arbitrary source (`tpl_{archetype}`) and an arbitrary target (`client_{id}_{slug}`, not a prefix-derived name), so this is a separate function, confirmed by reading the deployed definition directly (`pg_get_functiondef`), not assumed.

**Signature:** `create_client_schema_from_template(p_archetype text, p_specific_tables text[], p_client_schema text) RETURNS void`, `search_path` pinned to `''` from creation (same rationale as §8).

**What it does:**
1. Raises an exception if the source `tpl_{p_archetype}` schema doesn't exist (`create_archetype_template` has no equivalent guard, since it always creates its own target schema).
2. Creates the target client schema if it doesn't exist.
3. Copies all 21 common tables' structure from the source template via `CREATE TABLE ... (LIKE {source}.x INCLUDING ALL)`, same FK/RLS caveats as `create_archetype_template` — neither is carried over by `LIKE`, both re-applied explicitly.
4. Copies the archetype's specific table(s) the same way.
5. Re-adds every within-schema FK and the archetype-specific `conversion_id` FK, guarded against re-run.
6. Enables RLS on every copied table.
7. Revokes `anon`/`authenticated` privileges and sets the per-schema default-ACL guard, same posture as every other schema in this design.

Tested end-to-end against one throwaway client schema (`client_test_001_acme_emergency_test`) — see `Client_Onboarding_Sequence_Spec.md` for the full onboarding sequence and results. Not yet invoked as part of any automated onboarding flow — that orchestration (control.clients row creation, calling this function, populating archetype_settings, Data API schema exposure registration) remains Phase C work not yet built.

---

## 9. Security & Access Posture (identical across all 7 schemas)

Verified directly against the live database for `control`, `public`, and all 5 `tpl_*` schemas:

- **RLS**: enabled on all 146 tables, **0 policies** anywhere — default-deny.
- **`anon`/`authenticated` grants**: **0** across every table in every schema. Confirmed empirically (not assumed) that this required explicit remediation for `public` (Supabase pre-configures default ACLs specifically for `public`/`graphql_public` at provisioning, auto-granting these roles on new tables there) but did NOT require it for any new schema — `tpl_*` schemas start with zero default-ACL entries and zero grants natively. See `Supabase_MCP_Implementation_Notes.md` for the full empirical finding.
- **`service_role`**: `rolbypassrls = true` — bypasses RLS by Supabase's own design. This is the only role with practical access to any of this data today.
- **Data API exposure**: none of these schemas are registered in Supabase's Exposed Schemas list (that registration is a Phase C onboarding-automation step, not done here).

---

## 10. Total Table Count

```
control:            9 tables (updated 2026-08-01, migration 012 — +template_versions)
public:             27 tables (21 common + 6 archetype-specific) — reference scaffolding only
tpl_emergency:       22 tables (21 common + 1 archetype-specific)
tpl_commerce:        23 tables (21 common + 2 archetype-specific)
tpl_appointment:     22 tables (21 common + 1 archetype-specific)
tpl_consultation:    22 tables (21 common + 1 archetype-specific)
tpl_engagement:      22 tables (21 common + 1 archetype-specific)

TOTAL LIVE TABLES (this design): 147
DISTINCT TABLE STRUCTURES:        36  (9 control + 21 common + 6 archetype-specific)
ENUM TYPES:                       42
INDEXES:                          26
FUNCTIONS:                        2  (create_archetype_template, create_client_schema_from_template — added 2026-08-01, migration 013)
```
