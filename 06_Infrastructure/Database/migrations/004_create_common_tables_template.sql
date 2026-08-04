-- ============================================================================
-- 004_create_common_tables_template.sql
-- Phase A — Zenny Database Structure v3
-- Source: 06_Infrastructure/Database/Database_Structure_v3.md, §4
--
-- All 21 common tables, written SCHEMA-AGNOSTICALLY — no schema prefix
-- anywhere in this file. Applied once per template schema in Phase B
-- (tpl_emergency, tpl_commerce, tpl_appointment, tpl_consultation,
-- tpl_engagement) against whatever schema is active in the session
-- (`search_path` / `SET search_path TO ...` at execution time).
--
-- DEPENDS ON 003 (enum types) already existing in the database — enum
-- TYPES live at the database level, not per-schema, so they do not need to
-- be recreated per template; they were created once by file 003.
--
-- The first 4 tables (client_config, templates, email_categories,
-- recovery_cadence_profiles) mirror their control.* counterparts' column
-- structure exactly, per §4's instruction to copy definitions faithfully.
-- They carry no cross-schema FK back to control.* (per §6, Item 2 — no
-- cross-schema foreign keys anywhere) and no local FK either, since the
-- Control-side annotations they mirror don't specify one (email_categories,
-- recovery_cadence_profiles) or would require a local `clients` table that
-- does not exist in these schemas (client_config, templates).
--
-- json vs jsonb: only `archetype_settings` (client_config) is mandated as
-- jsonb (session instructions, rule 4). Other json-typed fields
-- (growth_handoff_payload's 3 columns, recovery_queue.recovery_context,
-- tool_call_log's 2 payload columns) are kept as plain `json`, matching the
-- source document's literal "json" annotation — not broadened to jsonb.
--
-- timestamp vs timestamptz: every column the source document types
-- "timestamp" (active_issues.since_timestamp, recovery_queue.next_follow_up,
-- tool_call_log.timestamp) is created as timestamptz here per the session
-- instructions (rule 4: timestamptz for ALL timestamp columns, not bare
-- timestamp). draft_edit_log.timestamp is the one exception: the source
-- document explicitly types it "date", not "timestamp", despite the column
-- name — kept literally as `date`; flagged in the completion report as a
-- likely source-document inconsistency worth the architect's attention.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- client_config (mirrors control.client_config)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_config (
    client_id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_mode                      language_mode_enum NOT NULL,
    language_list                      text[] NOT NULL,
    default_country_code               text NOT NULL,
    max_booking_horizon                integer NOT NULL,
    send_window_start                  time NOT NULL,
    send_window_end                    time NOT NULL,
    after_hours_emergency_contact      text,
    reactivation_threshold_override    integer,
    email_address                      text NOT NULL,
    kb_email_file_id                   text,
    archetype_settings                 jsonb NOT NULL,

    CONSTRAINT chk_client_config_max_booking_horizon_nonneg
        CHECK (max_booking_horizon >= 0),
    CONSTRAINT chk_client_config_reactivation_threshold_nonneg
        CHECK (reactivation_threshold_override IS NULL OR reactivation_threshold_override >= 0),
    CONSTRAINT chk_client_config_email_address_format
        CHECK (email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ----------------------------------------------------------------------------
-- templates (mirrors control.templates)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS templates (
    template_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid,
    template_key    text NOT NULL,
    template_type   template_type_enum NOT NULL,
    archetype       archetype_enum,
    language        text NOT NULL,
    content         text NOT NULL,
    version         integer NOT NULL,
    active          boolean NOT NULL,
    created_date    date NOT NULL,

    CONSTRAINT chk_templates_version_positive CHECK (version >= 1)
);

-- ----------------------------------------------------------------------------
-- email_categories (mirrors control.email_categories)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_categories (
    category_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid,
    category_name   text NOT NULL,
    category_scope  category_scope_enum NOT NULL,
    routing_rule    text NOT NULL
);

-- ----------------------------------------------------------------------------
-- recovery_cadence_profiles (local/synced copy)
-- CORRECTION 1 (Corrections_and_PhaseA_MCP_Execution.md, Part 1): this
-- local copy deliberately does NOT carry client_id or the override
-- machinery from control.recovery_cadence_profiles. By the time this table
-- is synced into one specific client's schema, the default-vs-override
-- merge has already happened upstream — this table holds the one resolved
-- row per archetype+step for that client. Resolving default-vs-override
-- into a single row is a Phase C (sync workflow) responsibility, not
-- something this local schema tracks.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recovery_cadence_profiles (
    id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    archetype                  archetype_enum NOT NULL,
    step_number                integer NOT NULL,
    delay_from_previous_step   integer NOT NULL,
    delay_unit                 delay_unit_enum NOT NULL,

    CONSTRAINT recovery_cadence_local_unique UNIQUE (archetype, step_number),
    CONSTRAINT chk_recovery_cadence_profiles_step_positive CHECK (step_number >= 1),
    CONSTRAINT chk_recovery_cadence_profiles_delay_nonneg CHECK (delay_from_previous_step >= 0)
);

-- ----------------------------------------------------------------------------
-- kb_entries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kb_entries (
    entry_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category    text NOT NULL,
    question    text NOT NULL,
    answer      text NOT NULL,
    language    text NOT NULL,
    active      boolean NOT NULL
);

-- ----------------------------------------------------------------------------
-- customers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    customer_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_contact_method  text NOT NULL,
    session_state           session_state_enum NOT NULL,
    last_conversion_date    date,
    created_date            date NOT NULL
);

-- ----------------------------------------------------------------------------
-- channel_identity_links
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS channel_identity_links (
    link_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id        uuid NOT NULL REFERENCES customers(customer_id),
    channel_type       channel_type_enum NOT NULL,
    channel_value      text NOT NULL,
    match_confidence   match_confidence_enum NOT NULL,
    linked_date        date NOT NULL
);

-- ----------------------------------------------------------------------------
-- customer_preferences
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_preferences (
    preference_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id       uuid NOT NULL REFERENCES customers(customer_id),
    preference_type   text NOT NULL,
    preference_value  text NOT NULL,
    source            preference_source_enum NOT NULL,
    created_date      date NOT NULL,
    last_confirmed    date
);

-- ----------------------------------------------------------------------------
-- active_issues
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS active_issues (
    issue_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id            uuid NOT NULL REFERENCES customers(customer_id),
    current_owner          issue_owner_enum NOT NULL,
    issue_reference_type   issue_reference_type_enum,
    issue_reference_id     uuid,
    since_timestamp        timestamptz NOT NULL
);

-- ----------------------------------------------------------------------------
-- leads
-- recovery_profile is kept as `text`, not an enum: the source document
-- types it "enum, nullable" but never lists its value set anywhere in the
-- document (unlike every other enum column). Inventing values would
-- violate "don't silently invent structure" — flagged in the completion
-- report as an open item for the architect.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
    lead_id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id             uuid NOT NULL REFERENCES customers(customer_id),
    archetype                archetype_enum NOT NULL,
    intent                    text NOT NULL,
    source_channel             source_channel_enum NOT NULL,
    conversation_summary        text NOT NULL,
    lead_score                   integer,
    status                        lead_status_enum NOT NULL,
    recovery_profile              text,
    validation_flag                boolean NOT NULL,
    validation_notes                text,
    created_date                     date NOT NULL,
    last_interaction                  date NOT NULL,

    CONSTRAINT chk_leads_lead_score_nonneg CHECK (lead_score IS NULL OR lead_score >= 0)
);

-- ----------------------------------------------------------------------------
-- complaints
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                         uuid REFERENCES leads(lead_id),
    customer_id                     uuid NOT NULL REFERENCES customers(customer_id),
    issue_description                text NOT NULL,
    distributive_addressed           boolean NOT NULL,
    procedural_addressed             boolean NOT NULL,
    interactional_addressed          boolean NOT NULL,
    resolution                       text,
    proportionate_remedy_applied     boolean NOT NULL,
    escalated                        boolean NOT NULL,
    created_date                     date NOT NULL,
    resolved_date                    date
);

-- ----------------------------------------------------------------------------
-- growth_events — one row per lead (summary state, not an event log; §8)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS growth_events (
    lead_id                 uuid PRIMARY KEY REFERENCES leads(lead_id),
    buying_stage            buying_stage_enum NOT NULL,
    recommended_solution    text,
    recommendation_reason   text,
    objection_type          objection_type_enum,
    objection_resolved      boolean,
    upsell_offered          boolean NOT NULL,
    upsell_accepted         boolean,
    growth_exit_type        growth_exit_type_enum NOT NULL
);

-- ----------------------------------------------------------------------------
-- growth_handoff_payload
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS growth_handoff_payload (
    lead_id                    uuid PRIMARY KEY REFERENCES leads(lead_id),
    selected_solution          text,
    resolved_objections        json,
    pending_questions          json,
    captured_contact_fields    json
);

-- ----------------------------------------------------------------------------
-- conversions (core)
-- final_state reuses conversion_state_enum — see file 003's header note.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversions (
    conversion_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                     uuid NOT NULL REFERENCES leads(lead_id),
    conversion_mode             conversion_mode_enum NOT NULL,
    conversion_state            conversion_state_enum NOT NULL,
    source_module               source_module_enum NOT NULL,
    required_fields_status      required_fields_status_enum NOT NULL,
    external_action_status      external_action_status_enum NOT NULL,
    failure_reason               text,
    final_state                  conversion_state_enum NOT NULL,
    recovery_eligible            boolean NOT NULL,
    calendar_event_id            text,
    created_date                 date NOT NULL,
    confirmed_date               date
);

-- ----------------------------------------------------------------------------
-- recovery_queue
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recovery_queue (
    recovery_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                 uuid NOT NULL REFERENCES leads(lead_id),
    conversion_id           uuid REFERENCES conversions(conversion_id),
    recovery_source         recovery_source_enum NOT NULL,
    current_step            integer NOT NULL,
    status                  recovery_status_enum NOT NULL,
    next_follow_up          timestamptz NOT NULL,
    last_attempt_date       date,
    attempt_count           integer NOT NULL,
    human_ownership_flag    boolean NOT NULL,
    recovery_context        json NOT NULL,
    created_date             date NOT NULL,

    CONSTRAINT chk_recovery_queue_current_step_nonneg CHECK (current_step >= 0),
    CONSTRAINT chk_recovery_queue_attempt_count_nonneg CHECK (attempt_count >= 0)
);

-- ----------------------------------------------------------------------------
-- suppression_records
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppression_records (
    suppression_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_method       text NOT NULL,
    suppression_type     suppression_type_enum NOT NULL,
    channel_scope        channel_scope_enum NOT NULL,
    lead_id              uuid REFERENCES leads(lead_id),
    created_date         date NOT NULL
);

-- ----------------------------------------------------------------------------
-- emails
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emails (
    email_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         uuid NOT NULL REFERENCES customers(customer_id),
    lead_id             uuid REFERENCES leads(lead_id),
    gmail_thread_id     text NOT NULL,
    gmail_message_id    text NOT NULL,
    category_id         uuid NOT NULL REFERENCES email_categories(category_id),
    thread_lifecycle    thread_lifecycle_enum NOT NULL,
    email_status        email_status_enum NOT NULL,
    reply_style         reply_style_enum NOT NULL,
    draft_content       text,
    sent_content        text,
    bounce_status       bounce_status_enum,
    received_date       date NOT NULL
);

-- ----------------------------------------------------------------------------
-- attachments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
    attachment_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id           uuid NOT NULL REFERENCES emails(email_id),
    attachment_type    attachment_type_enum NOT NULL
);

-- ----------------------------------------------------------------------------
-- draft_edit_log
-- "timestamp" column kept as `date` per the source document's literal type
-- annotation — see this file's header note.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS draft_edit_log (
    edit_id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id                  uuid NOT NULL REFERENCES emails(email_id),
    ai_draft                  text NOT NULL,
    human_approved_version    text NOT NULL,
    edit_category              edit_category_enum NOT NULL,
    "timestamp"                    date NOT NULL
);

-- ----------------------------------------------------------------------------
-- escalations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escalations (
    escalation_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id               uuid REFERENCES leads(lead_id),
    customer_id           uuid NOT NULL REFERENCES customers(customer_id),
    escalation_type       text NOT NULL,
    escalation_reason     text NOT NULL,
    escalation_priority   escalation_priority_enum NOT NULL,
    origin_module         module_name_enum NOT NULL,
    trigger_condition     text NOT NULL,
    ownership_state       ownership_state_enum NOT NULL,
    status                escalation_status_enum NOT NULL,
    created_date          date NOT NULL,
    resolved_date         date
);

-- ----------------------------------------------------------------------------
-- tool_call_log
-- lead_id has no FK annotation in the source document (unlike, e.g.,
-- escalations.lead_id) — left unconstrained here per the literal-fidelity
-- convention described in this file's header.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_call_log (
    call_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name            text NOT NULL,
    calling_module       module_name_enum NOT NULL,
    lead_id              uuid,
    state                tool_call_state_enum NOT NULL,
    request_payload      json NOT NULL,
    response_payload     json,
    "timestamp"          timestamptz NOT NULL
);
