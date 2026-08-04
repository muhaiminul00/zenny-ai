-- ============================================================================
-- 002_create_control_tables.sql
-- Phase A — Zenny Database Structure v3
-- Source: 06_Infrastructure/Database/Database_Structure_v3.md, §3
--
-- All 8 Control schema tables. DEPENDS ON 003 (enum types) HAVING ALREADY
-- RUN — every enum-typed column below references a type created there.
-- Despite the file numbering (which follows SQL_Phase_A_Instructions.md's
-- topic order, not execution order), apply 003 before this file.
--
-- Nullability convention used throughout this migration set: a column is
-- NOT NULL unless Database_Structure_v3.md explicitly annotates it
-- "nullable" — the source document itself follows this convention (it flags
-- nullable columns explicitly and leaves the rest unannotated).
--
-- FK convention: a `client_id` (or similar) column only gets a REFERENCES
-- constraint where the source document explicitly annotates
-- "(FK -> clients)" next to it. Where the document lists a plain
-- "uuid, nullable" with no FK annotation (email_categories.client_id,
-- recovery_cadence_profiles.client_id), no FK constraint is added here —
-- literal fidelity to the document, flagged in the completion report as an
-- inconsistency worth the architect's attention (other client_id columns in
-- the same section ARE annotated as FKs).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- control.clients
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS control.clients (
    client_id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name         text NOT NULL,
    status                client_status_enum NOT NULL,
    billing_tier          text NOT NULL,
    archetype             archetype_enum NOT NULL,
    secondary_archetypes  archetype_enum[],
    client_schema_name    text NOT NULL,
    created_date          date NOT NULL
);

-- ----------------------------------------------------------------------------
-- control.client_active_modules
-- Source document lists no PK for this table. A composite PK of
-- (client_id, module_name) is added here as the minimal, non-invasive
-- interpretation — one row per client per module — flagged in the
-- completion report as an addition beyond the literal spec.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS control.client_active_modules (
    client_id    uuid NOT NULL REFERENCES control.clients(client_id),
    module_name  module_name_enum NOT NULL,
    enabled      boolean NOT NULL,
    PRIMARY KEY (client_id, module_name)
);

-- ----------------------------------------------------------------------------
-- control.client_config
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS control.client_config (
    client_id                          uuid PRIMARY KEY REFERENCES control.clients(client_id),

    -- GLOBAL fields
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

    -- PER-ARCHETYPE settings, JSONB, keyed by archetype/sub-variant.
    -- Shape is explicitly NOT validated at the database level per §3/§6 —
    -- application-layer (n8n) responsibility only.
    archetype_settings                 jsonb NOT NULL,

    CONSTRAINT chk_client_config_max_booking_horizon_nonneg
        CHECK (max_booking_horizon >= 0),
    CONSTRAINT chk_client_config_reactivation_threshold_nonneg
        CHECK (reactivation_threshold_override IS NULL OR reactivation_threshold_override >= 0),
    CONSTRAINT chk_client_config_email_address_format
        CHECK (email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ----------------------------------------------------------------------------
-- control.templates
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- control.email_categories
-- CORRECTION 2 (Corrections_and_PhaseA_MCP_Execution.md, Part 1): client_id
-- now has an explicit FK to control.clients, nullable (null = universal
-- default), matching templates.client_id's existing pattern. Supersedes
-- this migration set's original completion-report flag about the missing
-- annotation — the architect resolved that inconsistency in favor of FK.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS control.email_categories (
    category_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid REFERENCES control.clients(client_id),
    category_name   text NOT NULL,
    category_scope  category_scope_enum NOT NULL,
    routing_rule    text NOT NULL
);

-- ----------------------------------------------------------------------------
-- control.recovery_cadence_profiles
-- CORRECTION 1 (Corrections_and_PhaseA_MCP_Execution.md, Part 1): replaces
-- the literal (archetype, step_number) PK, which could not represent both
-- a default row and per-client override rows for the same archetype+step.
-- Now uses a surrogate `id` PK plus:
--   - a UNIQUE(archetype, step_number, client_id) constraint, so a given
--     client can have at most one override row per archetype+step
--   - a partial UNIQUE INDEX on (archetype, step_number) WHERE
--     client_id IS NULL, so exactly one archetype-default row can exist
--     per step (a plain UNIQUE constraint can't enforce this, since
--     Postgres treats every NULL as distinct)
-- client_id now also has an explicit FK to control.clients.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- control.agent_prompts
-- Control-only. Never synced to any client schema (§3).
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- control.sync_log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS control.sync_log (
    sync_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       uuid NOT NULL REFERENCES control.clients(client_id),
    table_synced    text NOT NULL,
    sync_timestamp  timestamptz NOT NULL,
    status          sync_status_enum NOT NULL,
    triggered_by    sync_trigger_enum NOT NULL
);

-- ----------------------------------------------------------------------------
-- FK-covering indexes on the 4 control.* client_id FK columns this file's
-- original scope note left out of file 006 (which only covers 004/005).
-- Added after get_advisors (performance) flagged these 4 as unindexed
-- foreign keys during this migration's execution/verification pass.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_control_email_categories_client_id ON control.email_categories(client_id);
CREATE INDEX IF NOT EXISTS idx_control_recovery_cadence_profiles_client_id ON control.recovery_cadence_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_control_sync_log_client_id ON control.sync_log(client_id);
CREATE INDEX IF NOT EXISTS idx_control_templates_client_id ON control.templates(client_id);
