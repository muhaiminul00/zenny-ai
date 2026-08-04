-- ============================================================================
-- 003_create_enum_types.sql
-- Phase A — Zenny Database Structure v3
-- Source: 06_Infrastructure/Database/Database_Structure_v3.md (all sections)
--
-- Every ENUM type referenced anywhere in the document, created once as a
-- named Postgres type so it can be reused across the Control schema and
-- every tpl_*/client schema without redefinition. Per §6's ENUM-vs-TABLE
-- resolution: ENUMs are used only for structurally-fixed value sets;
-- `templates` and `email_categories` remain reference tables, not enums.
--
-- MUST RUN BEFORE 002 (control tables) — see that file's header and this
-- migration set's completion report for the ordering note.
--
-- Naming collisions are NOT a concern between different enum TYPES sharing
-- a label (e.g. issue_owner_enum and module_name_enum both containing the
-- label 'email_manager') — Postgres scopes enum labels to their type.
--
-- EXECUTION NOTE: Postgres has no `CREATE TYPE IF NOT EXISTS`. The actual
-- migration history entry for this file (applied via MCP apply_migration)
-- wraps every statement below in a `DO $$ IF NOT EXISTS (...) THEN ... END
-- IF; END $$;` guard, purely so re-running this migration set against a
-- database where these types already exist (as they did in this session,
-- from the execute_sql build/verify pass) doesn't error. On a genuinely
-- fresh database, the plain CREATE TYPE statements below are exactly what
-- runs and are kept unguarded here for readability.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Control-schema-table enums
-- ---------------------------------------------------------------------------

-- control.clients.status
CREATE TYPE client_status_enum AS ENUM (
    'active', 'paused', 'onboarding', 'offboarded'
);

-- Shared across: control.clients.archetype / control.clients.secondary_archetypes,
-- control.templates.archetype, control.recovery_cadence_profiles.archetype,
-- control.agent_prompts.archetype, {schema}.leads.archetype.
-- Commerce is split into commerce_ecom / commerce_restaurant, not a bare
-- 'commerce' value — see completion report for the reasoning behind this
-- resolution of the archetype_enum sub-variant question.
CREATE TYPE archetype_enum AS ENUM (
    'emergency', 'commerce_ecom', 'commerce_restaurant',
    'appointment', 'consultation', 'engagement'
);

-- Shared across: control.client_active_modules.module_name,
-- control.agent_prompts.module, {schema}.escalations.origin_module,
-- {schema}.tool_call_log.calling_module.
-- Consolidated from the instructions' starting list, which named this
-- "module_name_enum" and a separate "prompt_module_enum" for
-- control.agent_prompts.module — both have the identical 5-value set, so
-- prompt_module_enum was dropped as redundant. See completion report.
CREATE TYPE module_name_enum AS ENUM (
    'core_agent', 'growth_agent', 'conversion_engine',
    'recovery_engine', 'email_manager'
);

-- control.client_config.language_mode
CREATE TYPE language_mode_enum AS ENUM (
    'fixed', 'adaptive'
);

-- control.templates.template_type
CREATE TYPE template_type_enum AS ENUM (
    'greeting', 'recovery_message', 'escalation_message',
    'booking_confirmation', 'nurture_message', 'other'
);

-- control.email_categories.category_scope
CREATE TYPE category_scope_enum AS ENUM (
    'customer_facing', 'operational'
);

-- Shared across: control.recovery_cadence_profiles.delay_unit
CREATE TYPE delay_unit_enum AS ENUM (
    'minutes', 'hours', 'days'
);

-- control.agent_prompts.status
CREATE TYPE prompt_status_enum AS ENUM (
    'stable', 'beta'
);

-- control.sync_log.status
CREATE TYPE sync_status_enum AS ENUM (
    'success', 'failed'
);

-- control.sync_log.triggered_by
CREATE TYPE sync_trigger_enum AS ENUM (
    'schedule', 'manual_edit', 'on_read'
);

-- ---------------------------------------------------------------------------
-- Common-table (schema-agnostic, files 004/005) enums
-- ---------------------------------------------------------------------------

-- {schema}.customers.session_state
CREATE TYPE session_state_enum AS ENUM (
    'new', 'returning_lead', 'existing_customer', 'dormant'
);

-- {schema}.channel_identity_links.channel_type
CREATE TYPE channel_type_enum AS ENUM (
    'email', 'phone', 'whatsapp', 'chat_session', 'sms'
);

-- {schema}.channel_identity_links.match_confidence
CREATE TYPE match_confidence_enum AS ENUM (
    'verified', 'probable', 'weak'
);

-- {schema}.customer_preferences.source
-- Added beyond the instructions' starting enum list — see completion report.
CREATE TYPE preference_source_enum AS ENUM (
    'explicit_statement', 'completed_action'
);

-- {schema}.active_issues.current_owner
CREATE TYPE issue_owner_enum AS ENUM (
    'human', 'live_conversation', 'email_manager',
    'recovery_engine', 'automation', 'none'
);

-- {schema}.active_issues.issue_reference_type
CREATE TYPE issue_reference_type_enum AS ENUM (
    'lead', 'complaint', 'escalation', 'conversion'
);

-- {schema}.leads.source_channel (distinct from channel_type_enum — different
-- value set: no 'chat_session', but adds 'instagram'/'facebook')
CREATE TYPE source_channel_enum AS ENUM (
    'website', 'whatsapp', 'instagram', 'facebook', 'email', 'sms'
);

-- {schema}.leads.status
CREATE TYPE lead_status_enum AS ENUM (
    'new', 'active', 'qualified', 'booked', 'closed', 'escalated'
);

-- {schema}.growth_events.buying_stage
CREATE TYPE buying_stage_enum AS ENUM (
    'explorer', 'evaluator', 'ready_buyer'
);

-- {schema}.growth_events.objection_type
CREATE TYPE objection_type_enum AS ENUM (
    'price', 'trust', 'timing', 'confusion', 'competitor'
);

-- {schema}.growth_events.growth_exit_type
CREATE TYPE growth_exit_type_enum AS ENUM (
    'handoff_to_conversion', 'abandoned', 'recovery_candidate', 'no_suitable_match'
);

-- {schema}.conversions.conversion_mode
CREATE TYPE conversion_mode_enum AS ENUM (
    'A', 'B', 'C'
);

-- {schema}.conversions.conversion_state — also reused for
-- {schema}.conversions.final_state (see completion report: final_state's
-- value set is undocumented, and reusing conversion_state_enum was judged
-- the safer reasoned choice over inventing a new, undocumented type).
CREATE TYPE conversion_state_enum AS ENUM (
    'intent_confirmed', 'data_collection', 'action_pending', 'confirmed',
    'failed_recoverable', 'failed_escalation', 'cancelled'
);

-- {schema}.conversions.source_module
CREATE TYPE source_module_enum AS ENUM (
    'growth_agent', 'direct'
);

-- {schema}.conversions.required_fields_status
CREATE TYPE required_fields_status_enum AS ENUM (
    'all_collected', 'partial', 'none'
);

-- {schema}.conversions.external_action_status
CREATE TYPE external_action_status_enum AS ENUM (
    'success', 'failed_recoverable', 'failed_escalation', 'not_attempted'
);

-- {schema}.recovery_queue.recovery_source — "A through I, per Module 4 §8".
-- Module 4 (Recovery Engine service module doc) is out of scope for this
-- migration set; only the letter codes are in Database_Structure_v3.md, not
-- their semantic meaning. Labels used verbatim as documented.
CREATE TYPE recovery_source_enum AS ENUM (
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'
);

-- {schema}.recovery_queue.status — "never 'failed'" per source doc
CREATE TYPE recovery_status_enum AS ENUM (
    'active', 'paused', 'completed', 'stopped'
);

-- {schema}.suppression_records.suppression_type
-- Added beyond the instructions' starting enum list — see completion report.
CREATE TYPE suppression_type_enum AS ENUM (
    'opt_out', 'spam_complaint'
);

-- {schema}.suppression_records.channel_scope
-- Added beyond the instructions' starting enum list — see completion report.
CREATE TYPE channel_scope_enum AS ENUM (
    'all', 'email', 'sms', 'whatsapp'
);

-- {schema}.emails.thread_lifecycle
CREATE TYPE thread_lifecycle_enum AS ENUM (
    'open', 'waiting_customer', 'waiting_business', 'resolved', 'stale'
);

-- {schema}.emails.email_status
CREATE TYPE email_status_enum AS ENUM (
    'new', 'human_review_required', 'draft_ready', 'sent',
    'auto_replied', 'escalated', 'closed', 'error'
);

-- {schema}.emails.reply_style
CREATE TYPE reply_style_enum AS ENUM (
    'scripted', 'generative'
);

-- {schema}.emails.bounce_status
CREATE TYPE bounce_status_enum AS ENUM (
    'delivered', 'bounced', 'spam_complaint'
);

-- {schema}.attachments.attachment_type
CREATE TYPE attachment_type_enum AS ENUM (
    'customer_evidence', 'business_document',
    'identity_payment_sensitive', 'recruiting', 'unknown'
);

-- {schema}.draft_edit_log.edit_category
CREATE TYPE edit_category_enum AS ENUM (
    'tone', 'scope', 'factual', 'escalation_violation'
);

-- {schema}.escalations.escalation_priority
CREATE TYPE escalation_priority_enum AS ENUM (
    'P1_immediate', 'P2_standard', 'P3_review'
);

-- {schema}.escalations.ownership_state
CREATE TYPE ownership_state_enum AS ENUM (
    'ai_owned', 'human_owned', 'collaborative'
);

-- {schema}.escalations.status
CREATE TYPE escalation_status_enum AS ENUM (
    'open', 'resolved'
);

-- {schema}.tool_call_log.state
CREATE TYPE tool_call_state_enum AS ENUM (
    'requested', 'waiting', 'success', 'failed', 'timeout'
);

-- ---------------------------------------------------------------------------
-- Archetype-specific-table (file 005) enums
-- ---------------------------------------------------------------------------

-- conversions_consultation.score_tier
-- Added beyond the instructions' starting enum list — see completion report.
CREATE TYPE score_tier_enum AS ENUM (
    'nurture', 'scored_booking', 'priority'
);

-- conversions_engagement.contribution_type
-- Added beyond the instructions' starting enum list — see completion report.
CREATE TYPE contribution_type_enum AS ENUM (
    'donate', 'volunteer', 'attend'
);
