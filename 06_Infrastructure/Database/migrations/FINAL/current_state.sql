-- ============================================================================
-- current_state.sql
-- Zenny Database — verified live-state snapshot, project "zenny-vault"
-- Generated: 2026-07-17, verified directly against information_schema /
-- pg_catalog (not reconstructed from memory). See README.md in this
-- directory for methodology and why this exists alongside, not instead
-- of, the applied migration history (001-013) in the parent directory.
--
-- UPDATED 2026-08-01: the 2026-07-17 snapshot predated migrations
-- 012_schema_version_tracking.sql and 013_create_client_schema_from_
-- template_function.sql (both applied ~25-30 min after the snapshot was
-- taken, same day) and was missing both — this was found during the
-- 2026-08-01 cross-architecture validation pass, cross-referenced against
-- Client_Onboarding_Sequence_Spec.md (2026-07-30), which already depended
-- on both. Section 3 (control.clients, control.template_versions) and the
-- new Section 7 (create_client_schema_from_template) below have been
-- added to reconcile this file with migrations 012/013. This reconciled
-- content is transcribed directly from the migration files themselves,
-- not re-verified live against pg_catalog — a live re-verification is
-- still recommended before treating this file as byte-for-byte current
-- again.
--
-- This file is a REFERENCE ARTIFACT, not something to (re-)apply against
-- the live "zenny-vault" project (its objects already exist there). It IS
-- valid, dependency-ordered DDL that would build an equivalent database
-- from scratch.
-- ============================================================================


-- ============================================================================
-- 1. SCHEMAS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS control;
-- public already exists (Supabase default schema) -- used here as
-- permanent reference scaffolding, never a template, never a client, never
-- live traffic. See Database_Structure_v4_FINAL.md §1.
CREATE SCHEMA IF NOT EXISTS tpl_emergency;
CREATE SCHEMA IF NOT EXISTS tpl_commerce;
CREATE SCHEMA IF NOT EXISTS tpl_appointment;
CREATE SCHEMA IF NOT EXISTS tpl_consultation;
CREATE SCHEMA IF NOT EXISTS tpl_engagement;


-- ============================================================================
-- 2. ENUM TYPES (42 -- database-wide, created once, verified via pg_type/
-- pg_enum against the live database: 54 total enum types exist, 12 are
-- Supabase-platform-internal (auth/storage/realtime schemas), 42 are ours)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status_enum') THEN
    CREATE TYPE client_status_enum AS ENUM ('active', 'paused', 'onboarding', 'offboarded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'archetype_enum') THEN
    CREATE TYPE archetype_enum AS ENUM ('emergency', 'commerce_ecom', 'commerce_restaurant', 'appointment', 'consultation', 'engagement');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_name_enum') THEN
    CREATE TYPE module_name_enum AS ENUM ('core_agent', 'growth_agent', 'conversion_engine', 'recovery_engine', 'email_manager');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'language_mode_enum') THEN
    CREATE TYPE language_mode_enum AS ENUM ('fixed', 'adaptive');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_type_enum') THEN
    CREATE TYPE template_type_enum AS ENUM ('greeting', 'recovery_message', 'escalation_message', 'booking_confirmation', 'nurture_message', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_scope_enum') THEN
    CREATE TYPE category_scope_enum AS ENUM ('customer_facing', 'operational');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delay_unit_enum') THEN
    CREATE TYPE delay_unit_enum AS ENUM ('minutes', 'hours', 'days');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_status_enum') THEN
    CREATE TYPE prompt_status_enum AS ENUM ('stable', 'beta');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status_enum') THEN
    CREATE TYPE sync_status_enum AS ENUM ('success', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_trigger_enum') THEN
    CREATE TYPE sync_trigger_enum AS ENUM ('schedule', 'manual_edit', 'on_read');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_state_enum') THEN
    CREATE TYPE session_state_enum AS ENUM ('new', 'returning_lead', 'existing_customer', 'dormant');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type_enum') THEN
    CREATE TYPE channel_type_enum AS ENUM ('email', 'phone', 'whatsapp', 'chat_session', 'sms');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_confidence_enum') THEN
    CREATE TYPE match_confidence_enum AS ENUM ('verified', 'probable', 'weak');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preference_source_enum') THEN
    CREATE TYPE preference_source_enum AS ENUM ('explicit_statement', 'completed_action');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_owner_enum') THEN
    CREATE TYPE issue_owner_enum AS ENUM ('human', 'live_conversation', 'email_manager', 'recovery_engine', 'automation', 'none');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_reference_type_enum') THEN
    CREATE TYPE issue_reference_type_enum AS ENUM ('lead', 'complaint', 'escalation', 'conversion');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_channel_enum') THEN
    CREATE TYPE source_channel_enum AS ENUM ('website', 'whatsapp', 'instagram', 'facebook', 'email', 'sms');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status_enum') THEN
    CREATE TYPE lead_status_enum AS ENUM ('new', 'active', 'qualified', 'booked', 'closed', 'escalated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'buying_stage_enum') THEN
    CREATE TYPE buying_stage_enum AS ENUM ('explorer', 'evaluator', 'ready_buyer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'objection_type_enum') THEN
    CREATE TYPE objection_type_enum AS ENUM ('price', 'trust', 'timing', 'confusion', 'competitor');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'growth_exit_type_enum') THEN
    CREATE TYPE growth_exit_type_enum AS ENUM ('handoff_to_conversion', 'abandoned', 'recovery_candidate', 'no_suitable_match');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversion_mode_enum') THEN
    CREATE TYPE conversion_mode_enum AS ENUM ('A', 'B', 'C');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversion_state_enum') THEN
    CREATE TYPE conversion_state_enum AS ENUM ('intent_confirmed', 'data_collection', 'action_pending', 'confirmed', 'failed_recoverable', 'failed_escalation', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source_module_enum') THEN
    CREATE TYPE source_module_enum AS ENUM ('growth_agent', 'direct');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'required_fields_status_enum') THEN
    CREATE TYPE required_fields_status_enum AS ENUM ('all_collected', 'partial', 'none');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'external_action_status_enum') THEN
    CREATE TYPE external_action_status_enum AS ENUM ('success', 'failed_recoverable', 'failed_escalation', 'not_attempted');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recovery_source_enum') THEN
    CREATE TYPE recovery_source_enum AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recovery_status_enum') THEN
    CREATE TYPE recovery_status_enum AS ENUM ('active', 'paused', 'completed', 'stopped');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'suppression_type_enum') THEN
    CREATE TYPE suppression_type_enum AS ENUM ('opt_out', 'spam_complaint');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_scope_enum') THEN
    CREATE TYPE channel_scope_enum AS ENUM ('all', 'email', 'sms', 'whatsapp');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'thread_lifecycle_enum') THEN
    CREATE TYPE thread_lifecycle_enum AS ENUM ('open', 'waiting_customer', 'waiting_business', 'resolved', 'stale');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status_enum') THEN
    CREATE TYPE email_status_enum AS ENUM ('new', 'human_review_required', 'draft_ready', 'sent', 'auto_replied', 'escalated', 'closed', 'error');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reply_style_enum') THEN
    CREATE TYPE reply_style_enum AS ENUM ('scripted', 'generative');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bounce_status_enum') THEN
    CREATE TYPE bounce_status_enum AS ENUM ('delivered', 'bounced', 'spam_complaint');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_type_enum') THEN
    CREATE TYPE attachment_type_enum AS ENUM ('customer_evidence', 'business_document', 'identity_payment_sensitive', 'recruiting', 'unknown');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'edit_category_enum') THEN
    CREATE TYPE edit_category_enum AS ENUM ('tone', 'scope', 'factual', 'escalation_violation');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escalation_priority_enum') THEN
    CREATE TYPE escalation_priority_enum AS ENUM ('P1_immediate', 'P2_standard', 'P3_review');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ownership_state_enum') THEN
    CREATE TYPE ownership_state_enum AS ENUM ('ai_owned', 'human_owned', 'collaborative');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escalation_status_enum') THEN
    CREATE TYPE escalation_status_enum AS ENUM ('open', 'resolved');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tool_call_state_enum') THEN
    CREATE TYPE tool_call_state_enum AS ENUM ('requested', 'waiting', 'success', 'failed', 'timeout');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'score_tier_enum') THEN
    CREATE TYPE score_tier_enum AS ENUM ('nurture', 'scored_booking', 'priority');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contribution_type_enum') THEN
    CREATE TYPE contribution_type_enum AS ENUM ('donate', 'volunteer', 'attend');
  END IF;
END $$;


-- ============================================================================
-- 3. CONTROL SCHEMA TABLES (9, updated 2026-08-01 for migrations 012/013 --
-- see 012_schema_version_tracking.sql for control.template_versions and
-- control.clients.template_version/template_archetype_at_onboarding) --
-- includes both post-v3 corrections: recovery_cadence_profiles'
-- redesigned PK, and the 2 added FKs (email_categories.client_id,
-- recovery_cadence_profiles.client_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS control.clients (
    client_id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name                    text NOT NULL,
    status                           client_status_enum NOT NULL,
    billing_tier                     text NOT NULL,
    archetype                        archetype_enum NOT NULL,
    secondary_archetypes             archetype_enum[],
    client_schema_name               text NOT NULL,
    created_date                     date NOT NULL,
    template_version                 int NOT NULL DEFAULT 1,
    template_archetype_at_onboarding archetype_enum
);

CREATE TABLE IF NOT EXISTS control.client_active_modules (
    client_id    uuid NOT NULL REFERENCES control.clients(client_id),
    module_name  module_name_enum NOT NULL,
    enabled      boolean NOT NULL,
    PRIMARY KEY (client_id, module_name)
);

CREATE TABLE IF NOT EXISTS control.client_config (
    client_id                          uuid PRIMARY KEY REFERENCES control.clients(client_id),
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

CREATE TABLE IF NOT EXISTS control.templates (
    template_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid REFERENCES control.clients(client_id),
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

CREATE TABLE IF NOT EXISTS control.email_categories (
    category_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid REFERENCES control.clients(client_id),
    category_name   text NOT NULL,
    category_scope  category_scope_enum NOT NULL,
    routing_rule    text NOT NULL
);

CREATE TABLE IF NOT EXISTS control.recovery_cadence_profiles (
    id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    archetype                  archetype_enum NOT NULL,
    step_number                integer NOT NULL,
    delay_from_previous_step   integer NOT NULL,
    delay_unit                 delay_unit_enum NOT NULL,
    client_id                  uuid REFERENCES control.clients(client_id),
    CONSTRAINT recovery_cadence_client_override_unique
        UNIQUE (archetype, step_number, client_id),
    CONSTRAINT chk_recovery_cadence_profiles_step_positive CHECK (step_number >= 1),
    CONSTRAINT chk_recovery_cadence_profiles_delay_nonneg CHECK (delay_from_previous_step >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS recovery_cadence_default_unique
    ON control.recovery_cadence_profiles (archetype, step_number)
    WHERE client_id IS NULL;

CREATE TABLE IF NOT EXISTS control.agent_prompts (
    prompt_id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_key                 text NOT NULL,
    module                     module_name_enum NOT NULL,
    archetype                  archetype_enum,
    content                    text NOT NULL,
    version                    integer NOT NULL,
    status                     prompt_status_enum NOT NULL,
    created_date               date NOT NULL,
    promoted_to_stable_date    date,
    CONSTRAINT chk_agent_prompts_version_positive CHECK (version >= 1)
);

CREATE TABLE IF NOT EXISTS control.sync_log (
    sync_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid NOT NULL REFERENCES control.clients(client_id),
    table_synced    text NOT NULL,
    sync_timestamp  timestamptz NOT NULL,
    status          sync_status_enum NOT NULL,
    triggered_by    sync_trigger_enum NOT NULL
);

-- Added by 012_schema_version_tracking.sql (Phase C, Part 1) --
-- per-client template version tracking + a version log for the
-- templates themselves.
CREATE TABLE IF NOT EXISTS control.template_versions (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    archetype               archetype_enum NOT NULL,
    version                 int NOT NULL,
    change_description      text NOT NULL,
    applied_to_public       boolean NOT NULL DEFAULT true,
    created_date            date NOT NULL DEFAULT current_date,
    CONSTRAINT template_versions_unique UNIQUE (archetype, version)
);

CREATE INDEX IF NOT EXISTS idx_control_email_categories_client_id ON control.email_categories(client_id);
CREATE INDEX IF NOT EXISTS idx_control_recovery_cadence_profiles_client_id ON control.recovery_cadence_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_control_sync_log_client_id ON control.sync_log(client_id);
CREATE INDEX IF NOT EXISTS idx_control_templates_client_id ON control.templates(client_id);

ALTER TABLE control.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.client_active_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.client_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.recovery_cadence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.template_versions ENABLE ROW LEVEL SECURITY;

-- Seed rows (012), one per archetype_enum value -- commerce_ecom and
-- commerce_restaurant tracked as independent peer rows since the enum
-- has no bare 'commerce' value, though both share the single
-- tpl_commerce schema and will always version together in practice.
INSERT INTO control.template_versions (archetype, version, change_description)
VALUES
    ('emergency', 1, 'Initial Phase A/B build'),
    ('commerce_ecom', 1, 'Initial Phase A/B build'),
    ('commerce_restaurant', 1, 'Initial Phase A/B build'),
    ('appointment', 1, 'Initial Phase A/B build'),
    ('consultation', 1, 'Initial Phase A/B build'),
    ('engagement', 1, 'Initial Phase A/B build')
ON CONFLICT (archetype, version) DO NOTHING;


-- ============================================================================
-- 4. PUBLIC REFERENCE SCAFFOLDING -- 21 common + 6 archetype-specific
-- tables. Permanent reference scaffolding (see Database_Structure_v4_
-- FINAL.md §1) -- Phase B copies FROM this, never INTO it.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.client_config (
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

CREATE TABLE IF NOT EXISTS public.templates (
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

CREATE TABLE IF NOT EXISTS public.email_categories (
    category_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid,
    category_name   text NOT NULL,
    category_scope  category_scope_enum NOT NULL,
    routing_rule    text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recovery_cadence_profiles (
    id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    archetype                  archetype_enum NOT NULL,
    step_number                integer NOT NULL,
    delay_from_previous_step   integer NOT NULL,
    delay_unit                 delay_unit_enum NOT NULL,
    CONSTRAINT recovery_cadence_local_unique UNIQUE (archetype, step_number),
    CONSTRAINT chk_recovery_cadence_profiles_step_positive CHECK (step_number >= 1),
    CONSTRAINT chk_recovery_cadence_profiles_delay_nonneg CHECK (delay_from_previous_step >= 0)
);

CREATE TABLE IF NOT EXISTS public.kb_entries (
    entry_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category    text NOT NULL,
    question    text NOT NULL,
    answer      text NOT NULL,
    language    text NOT NULL,
    active      boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
    customer_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_contact_method  text NOT NULL,
    session_state           session_state_enum NOT NULL,
    last_conversion_date    date,
    created_date            date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.channel_identity_links (
    link_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id        uuid NOT NULL REFERENCES public.customers(customer_id),
    channel_type       channel_type_enum NOT NULL,
    channel_value      text NOT NULL,
    match_confidence   match_confidence_enum NOT NULL,
    linked_date        date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_preferences (
    preference_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id       uuid NOT NULL REFERENCES public.customers(customer_id),
    preference_type   text NOT NULL,
    preference_value  text NOT NULL,
    source            preference_source_enum NOT NULL,
    created_date      date NOT NULL,
    last_confirmed    date
);

CREATE TABLE IF NOT EXISTS public.active_issues (
    issue_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id            uuid NOT NULL REFERENCES public.customers(customer_id),
    current_owner          issue_owner_enum NOT NULL,
    issue_reference_type   issue_reference_type_enum,
    issue_reference_id     uuid,
    since_timestamp        timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leads (
    lead_id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id             uuid NOT NULL REFERENCES public.customers(customer_id),
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

CREATE TABLE IF NOT EXISTS public.complaints (
    complaint_id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                         uuid REFERENCES public.leads(lead_id),
    customer_id                     uuid NOT NULL REFERENCES public.customers(customer_id),
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

CREATE TABLE IF NOT EXISTS public.growth_events (
    lead_id                 uuid PRIMARY KEY REFERENCES public.leads(lead_id),
    buying_stage            buying_stage_enum NOT NULL,
    recommended_solution    text,
    recommendation_reason   text,
    objection_type          objection_type_enum,
    objection_resolved      boolean,
    upsell_offered          boolean NOT NULL,
    upsell_accepted         boolean,
    growth_exit_type        growth_exit_type_enum NOT NULL
);

CREATE TABLE IF NOT EXISTS public.growth_handoff_payload (
    lead_id                    uuid PRIMARY KEY REFERENCES public.leads(lead_id),
    selected_solution          text,
    resolved_objections        json,
    pending_questions          json,
    captured_contact_fields    json
);

CREATE TABLE IF NOT EXISTS public.conversions (
    conversion_id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                     uuid NOT NULL REFERENCES public.leads(lead_id),
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

CREATE TABLE IF NOT EXISTS public.recovery_queue (
    recovery_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id                 uuid NOT NULL REFERENCES public.leads(lead_id),
    conversion_id           uuid REFERENCES public.conversions(conversion_id),
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

CREATE TABLE IF NOT EXISTS public.suppression_records (
    suppression_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_method       text NOT NULL,
    suppression_type     suppression_type_enum NOT NULL,
    channel_scope        channel_scope_enum NOT NULL,
    lead_id              uuid REFERENCES public.leads(lead_id),
    created_date         date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.emails (
    email_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         uuid NOT NULL REFERENCES public.customers(customer_id),
    lead_id             uuid REFERENCES public.leads(lead_id),
    gmail_thread_id     text NOT NULL,
    gmail_message_id    text NOT NULL,
    category_id         uuid NOT NULL REFERENCES public.email_categories(category_id),
    thread_lifecycle    thread_lifecycle_enum NOT NULL,
    email_status        email_status_enum NOT NULL,
    reply_style         reply_style_enum NOT NULL,
    draft_content       text,
    sent_content        text,
    bounce_status       bounce_status_enum,
    received_date       date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attachments (
    attachment_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id           uuid NOT NULL REFERENCES public.emails(email_id),
    attachment_type    attachment_type_enum NOT NULL
);

CREATE TABLE IF NOT EXISTS public.draft_edit_log (
    edit_id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id                  uuid NOT NULL REFERENCES public.emails(email_id),
    ai_draft                  text NOT NULL,
    human_approved_version    text NOT NULL,
    edit_category              edit_category_enum NOT NULL,
    "timestamp"                    date NOT NULL
);

CREATE TABLE IF NOT EXISTS public.escalations (
    escalation_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id               uuid REFERENCES public.leads(lead_id),
    customer_id           uuid NOT NULL REFERENCES public.customers(customer_id),
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

CREATE TABLE IF NOT EXISTS public.tool_call_log (
    call_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name            text NOT NULL,
    calling_module       module_name_enum NOT NULL,
    lead_id              uuid,
    state                tool_call_state_enum NOT NULL,
    request_payload      json NOT NULL,
    response_payload     json,
    "timestamp"          timestamptz NOT NULL
);

-- Archetype-specific (6)
CREATE TABLE IF NOT EXISTS public.conversions_emergency (
    conversion_id                  uuid PRIMARY KEY REFERENCES public.conversions(conversion_id),
    location                       text NOT NULL,
    dispatch_window                text NOT NULL,
    team_availability_confirmed    boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversions_ecom (
    conversion_id       uuid PRIMARY KEY REFERENCES public.conversions(conversion_id),
    items                json NOT NULL,
    quantity              integer NOT NULL,
    cart_value               numeric(12,2) NOT NULL,
    delivery_details             text,
    CONSTRAINT chk_conversions_ecom_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_conversions_ecom_cart_value_nonneg CHECK (cart_value >= 0)
);

CREATE TABLE IF NOT EXISTS public.conversions_restaurant (
    conversion_id       uuid PRIMARY KEY REFERENCES public.conversions(conversion_id),
    party_size           integer NOT NULL,
    reservation_time         timestamptz NOT NULL,
    table_confirmed              boolean NOT NULL,
    special_request                  text,
    CONSTRAINT chk_conversions_restaurant_party_size_positive CHECK (party_size > 0)
);

CREATE TABLE IF NOT EXISTS public.conversions_appointment (
    conversion_id     uuid PRIMARY KEY REFERENCES public.conversions(conversion_id),
    service_type       text NOT NULL,
    practitioner            text,
    appointment_time            timestamptz NOT NULL,
    special_request                  text
);

CREATE TABLE IF NOT EXISTS public.conversions_consultation (
    conversion_id    uuid PRIMARY KEY REFERENCES public.conversions(conversion_id),
    score              integer NOT NULL,
    score_tier             score_tier_enum NOT NULL,
    CONSTRAINT chk_conversions_consultation_score_nonneg CHECK (score >= 0)
);

CREATE TABLE IF NOT EXISTS public.conversions_engagement (
    conversion_id       uuid PRIMARY KEY REFERENCES public.conversions(conversion_id),
    contribution_type    contribution_type_enum NOT NULL,
    program_reference        text,
    tribute_name                  text
);

-- Indexes (22)
CREATE INDEX IF NOT EXISTS idx_channel_identity_links_customer_id ON public.channel_identity_links(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON public.customer_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_active_issues_customer_id ON public.active_issues(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON public.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_lead_id ON public.complaints(lead_id);
CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON public.complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversions_lead_id ON public.conversions(lead_id);
CREATE INDEX IF NOT EXISTS idx_recovery_queue_lead_id ON public.recovery_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_recovery_queue_conversion_id ON public.recovery_queue(conversion_id);
CREATE INDEX IF NOT EXISTS idx_suppression_records_lead_id ON public.suppression_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_customer_id ON public.emails(customer_id);
CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON public.emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_category_id ON public.emails(category_id);
CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON public.attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_draft_edit_log_email_id ON public.draft_edit_log(email_id);
CREATE INDEX IF NOT EXISTS idx_escalations_lead_id ON public.escalations(lead_id);
CREATE INDEX IF NOT EXISTS idx_escalations_customer_id ON public.escalations(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_date ON public.leads(created_date);
CREATE INDEX IF NOT EXISTS idx_recovery_queue_next_follow_up ON public.recovery_queue(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_emails_thread_lifecycle ON public.emails(thread_lifecycle);
CREATE INDEX IF NOT EXISTS idx_customers_primary_contact_method ON public.customers(primary_contact_method);

-- RLS (27 tables) + hardening (matches control's zero-grant posture)
ALTER TABLE public.client_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_cadence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_handoff_payload ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppression_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_edit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_call_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions_emergency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions_ecom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions_restaurant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions_appointment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions_engagement ENABLE ROW LEVEL SECURITY;

COMMENT ON SCHEMA public IS 'Zenny Phase A reference scaffolding ONLY. Holds the canonical 21 common + 6 archetype-specific table structures Phase B copies FROM to build tpl_emergency/tpl_commerce/tpl_appointment/tpl_consultation/tpl_engagement. Never itself a template, never copied into a live client schema, never receives real application traffic. RLS enabled + zero anon/authenticated grants on every table, same default-deny posture as the control schema.';

REVOKE ALL PRIVILEGES ON TABLE
  public.client_config, public.templates, public.email_categories, public.recovery_cadence_profiles,
  public.kb_entries, public.customers, public.channel_identity_links, public.customer_preferences,
  public.active_issues, public.leads, public.complaints, public.growth_events, public.growth_handoff_payload,
  public.conversions, public.recovery_queue, public.suppression_records, public.emails, public.attachments,
  public.draft_edit_log, public.escalations, public.tool_call_log,
  public.conversions_emergency, public.conversions_ecom, public.conversions_restaurant,
  public.conversions_appointment, public.conversions_consultation, public.conversions_engagement
FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;


-- ============================================================================
-- 5. TEMPLATE ASSEMBLY FUNCTION (verbatim, via pg_get_functiondef against
-- the live database -- SECURITY INVOKER, search_path pinned to '')
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_archetype_template(p_archetype text, p_specific_tables text[])
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_schema text := 'tpl_' || p_archetype;
    v_common_tables text[] := ARRAY[
        'client_config', 'templates', 'email_categories', 'recovery_cadence_profiles',
        'kb_entries', 'customers', 'channel_identity_links', 'customer_preferences',
        'active_issues', 'leads', 'complaints', 'growth_events', 'growth_handoff_payload',
        'conversions', 'recovery_queue', 'suppression_records', 'emails', 'attachments',
        'draft_edit_log', 'escalations', 'tool_call_log'
    ];
    v_fk_defs text[] := ARRAY[
        'channel_identity_links|customer_id|customers|customer_id',
        'customer_preferences|customer_id|customers|customer_id',
        'active_issues|customer_id|customers|customer_id',
        'leads|customer_id|customers|customer_id',
        'complaints|lead_id|leads|lead_id',
        'complaints|customer_id|customers|customer_id',
        'growth_events|lead_id|leads|lead_id',
        'growth_handoff_payload|lead_id|leads|lead_id',
        'conversions|lead_id|leads|lead_id',
        'recovery_queue|lead_id|leads|lead_id',
        'recovery_queue|conversion_id|conversions|conversion_id',
        'suppression_records|lead_id|leads|lead_id',
        'emails|customer_id|customers|customer_id',
        'emails|lead_id|leads|lead_id',
        'emails|category_id|email_categories|category_id',
        'attachments|email_id|emails|email_id',
        'draft_edit_log|email_id|emails|email_id',
        'escalations|lead_id|leads|lead_id',
        'escalations|customer_id|customers|customer_id'
    ];
    v_tbl text;
    v_fk text;
    v_parts text[];
    v_conname text;
    v_all_tables text[];
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema);

    FOREACH v_tbl IN ARRAY v_common_tables LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I.%I (LIKE public.%I INCLUDING ALL)',
            v_schema, v_tbl, v_tbl
        );
    END LOOP;

    FOREACH v_tbl IN ARRAY p_specific_tables LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I.%I (LIKE public.%I INCLUDING ALL)',
            v_schema, v_tbl, v_tbl
        );
    END LOOP;

    v_all_tables := v_common_tables || p_specific_tables;

    FOREACH v_fk IN ARRAY v_fk_defs LOOP
        v_parts := string_to_array(v_fk, '|');
        v_conname := v_parts[1] || '_' || v_parts[2] || '_fkey';
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_namespace n ON c.connamespace = n.oid
            WHERE n.nspname = v_schema AND c.conname = v_conname
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I)',
                v_schema, v_parts[1], v_conname, v_parts[2], v_schema, v_parts[3], v_parts[4]
            );
        END IF;
    END LOOP;

    FOREACH v_tbl IN ARRAY p_specific_tables LOOP
        v_conname := v_tbl || '_conversion_id_fkey';
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_namespace n ON c.connamespace = n.oid
            WHERE n.nspname = v_schema AND c.conname = v_conname
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (conversion_id) REFERENCES %I.conversions(conversion_id)',
                v_schema, v_tbl, v_conname, v_schema
            );
        END IF;
    END LOOP;

    FOREACH v_tbl IN ARRAY v_all_tables LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_tbl);
    END LOOP;

    FOREACH v_tbl IN ARRAY v_all_tables LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %I.%I FROM anon, authenticated', v_schema, v_tbl);
    END LOOP;
    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA %I REVOKE ALL ON TABLES FROM anon, authenticated',
        v_schema
    );
END;
$function$
;
-- Security mode verified: SECURITY INVOKER (pg_proc.prosecdef = false).
-- No EXECUTE revoke needed/applied -- see Database_Structure_v4_FINAL.md §8.


-- ============================================================================
-- 6. TEMPLATE SCHEMA ASSEMBLY (produces the 5 tpl_* schemas' 111 tables --
-- 22+23+22+22+22 -- with within-schema FKs, RLS, and zero-grant posture,
-- all verified live per Database_Structure_v4_FINAL.md §9)
-- ============================================================================
SELECT public.create_archetype_template('emergency', ARRAY['conversions_emergency']);
SELECT public.create_archetype_template('commerce', ARRAY['conversions_ecom', 'conversions_restaurant']);
SELECT public.create_archetype_template('appointment', ARRAY['conversions_appointment']);
SELECT public.create_archetype_template('consultation', ARRAY['conversions_consultation']);
SELECT public.create_archetype_template('engagement', ARRAY['conversions_engagement']);


-- ============================================================================
-- 7. CLIENT SCHEMA FROM TEMPLATE FUNCTION (added 2026-08-01, migration 013 --
-- Phase C, Part 2. Verbatim per 013_create_client_schema_from_template_
-- function.sql. NOT a reuse of create_archetype_template (Section 5) --
-- that function hardcodes 'public' as source and derives the target name
-- as 'tpl_' || archetype; this one takes an arbitrary source template
-- schema and an arbitrary target client schema name, for onboarding.
-- Tested end-to-end against one throwaway client
-- (client_test_001_acme_emergency_test) -- see
-- Client_Onboarding_Sequence_Spec.md for full results.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_client_schema_from_template(
    p_archetype text,
    p_specific_tables text[],
    p_client_schema text
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
    v_source_schema text := 'tpl_' || p_archetype;
    v_target_schema text := p_client_schema;
    v_common_tables text[] := ARRAY[
        'client_config', 'templates', 'email_categories', 'recovery_cadence_profiles',
        'kb_entries', 'customers', 'channel_identity_links', 'customer_preferences',
        'active_issues', 'leads', 'complaints', 'growth_events', 'growth_handoff_payload',
        'conversions', 'recovery_queue', 'suppression_records', 'emails', 'attachments',
        'draft_edit_log', 'escalations', 'tool_call_log'
    ];
    v_fk_defs text[] := ARRAY[
        'channel_identity_links|customer_id|customers|customer_id',
        'customer_preferences|customer_id|customers|customer_id',
        'active_issues|customer_id|customers|customer_id',
        'leads|customer_id|customers|customer_id',
        'complaints|lead_id|leads|lead_id',
        'complaints|customer_id|customers|customer_id',
        'growth_events|lead_id|leads|lead_id',
        'growth_handoff_payload|lead_id|leads|lead_id',
        'conversions|lead_id|leads|lead_id',
        'recovery_queue|lead_id|leads|lead_id',
        'recovery_queue|conversion_id|conversions|conversion_id',
        'suppression_records|lead_id|leads|lead_id',
        'emails|customer_id|customers|customer_id',
        'emails|lead_id|leads|lead_id',
        'emails|category_id|email_categories|category_id',
        'attachments|email_id|emails|email_id',
        'draft_edit_log|email_id|emails|email_id',
        'escalations|lead_id|leads|lead_id',
        'escalations|customer_id|customers|customer_id'
    ];
    v_tbl text;
    v_fk text;
    v_parts text[];
    v_conname text;
    v_all_tables text[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = v_source_schema) THEN
        RAISE EXCEPTION 'Source template schema % does not exist', v_source_schema;
    END IF;

    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_target_schema);

    FOREACH v_tbl IN ARRAY v_common_tables LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I.%I (LIKE %I.%I INCLUDING ALL)',
            v_target_schema, v_tbl, v_source_schema, v_tbl
        );
    END LOOP;

    FOREACH v_tbl IN ARRAY p_specific_tables LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I.%I (LIKE %I.%I INCLUDING ALL)',
            v_target_schema, v_tbl, v_source_schema, v_tbl
        );
    END LOOP;

    v_all_tables := v_common_tables || p_specific_tables;

    FOREACH v_fk IN ARRAY v_fk_defs LOOP
        v_parts := string_to_array(v_fk, '|');
        v_conname := v_parts[1] || '_' || v_parts[2] || '_fkey';
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_namespace n ON c.connamespace = n.oid
            WHERE n.nspname = v_target_schema AND c.conname = v_conname
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I)',
                v_target_schema, v_parts[1], v_conname, v_parts[2], v_target_schema, v_parts[3], v_parts[4]
            );
        END IF;
    END LOOP;

    FOREACH v_tbl IN ARRAY p_specific_tables LOOP
        v_conname := v_tbl || '_conversion_id_fkey';
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            JOIN pg_namespace n ON c.connamespace = n.oid
            WHERE n.nspname = v_target_schema AND c.conname = v_conname
        ) THEN
            EXECUTE format(
                'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (conversion_id) REFERENCES %I.conversions(conversion_id)',
                v_target_schema, v_tbl, v_conname, v_target_schema
            );
        END IF;
    END LOOP;

    FOREACH v_tbl IN ARRAY v_all_tables LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_target_schema, v_tbl);
    END LOOP;

    FOREACH v_tbl IN ARRAY v_all_tables LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %I.%I FROM anon, authenticated', v_target_schema, v_tbl);
    END LOOP;
    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA %I REVOKE ALL ON TABLES FROM anon, authenticated',
        v_target_schema
    );
END;
$function$
;
