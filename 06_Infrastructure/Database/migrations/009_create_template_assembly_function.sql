-- ============================================================================
-- 009_create_template_assembly_function.sql
-- Phase B — Zenny Database Structure v3
-- Source: SQL_Phase_B_Instructions.md, Requirement 1
--
-- Reusable, re-runnable function to build (or rebuild) a single tpl_*
-- template schema by copying public's reference table structures. Invoked
-- 5 times, once per archetype, in 010_assemble_all_templates.sql.
--
-- EMPIRICAL FINDINGS THIS FUNCTION ENCODES (tested during this migration's
-- build, not assumed from the instructions file's wording):
--
-- 1. `CREATE TABLE ... (LIKE public.x INCLUDING ALL)` does NOT copy foreign
--    key constraints, regardless of INCLUDING ALL/INCLUDING CONSTRAINTS.
--    Verified directly: copying `leads` (which FKs to `customers`) via LIKE
--    produced a CHECK constraint and a PRIMARY KEY, but zero FK constraints
--    (queried pg_constraint, contype='f' -> 0 rows). This contradicts the
--    Phase B instructions file's stated assumption. Per Postgres docs, this
--    is documented, correct behavior: INCLUDING INDEXES copies PRIMARY
--    KEY/UNIQUE (implemented as indexes), but FOREIGN KEY constraints are
--    never copied by LIKE under any option. Step 3 below explicitly adds
--    every FK, pointed at the local schema's own tables.
--
-- 2. Enum types are NOT duplicated per schema (Requirement 2) — they are
--    database-wide, not schema-scoped in Postgres. This function references
--    the shared types created once in 003_create_enum_types.sql implicitly,
--    via the columns' existing type definitions carried over by LIKE. No
--    CREATE TYPE statements appear anywhere in this file.
--
-- 3. Data API exposure (Requirement 5) was tested empirically, not assumed:
--    created a throwaway schema + one table copied via LIKE, queried
--    information_schema.role_table_grants and pg_default_acl for
--    anon/authenticated immediately after. Result: ZERO grants, ZERO
--    default-ACL entries. Phase A's earlier `ALTER DEFAULT PRIVILEGES FOR
--    ROLE postgres IN SCHEMA public` fix is schema-scoped by Postgres
--    semantics and does NOT extend to new schemas — but new schemas were
--    never affected by the original auto-grant behavior in the first
--    place, because that behavior came from a default-ACL entry Supabase
--    pre-configures specifically for the `public` (and `graphql_public`)
--    schema at project provisioning, not a role-wide default. A fresh
--    schema like tpl_emergency has no such entry and starts clean. Steps 5
--    and 6 below still explicitly REVOKE and set a per-schema default-ACL
--    guard anyway, as defense-in-depth / for posture parity with
--    public/control — not because testing showed it was required.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_archetype_template(
    p_archetype text,
    p_specific_tables text[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_schema text := 'tpl_' || p_archetype;
    v_common_tables text[] := ARRAY[
        'client_config', 'templates', 'email_categories', 'recovery_cadence_profiles',
        'kb_entries', 'customers', 'channel_identity_links', 'customer_preferences',
        'active_issues', 'leads', 'complaints', 'growth_events', 'growth_handoff_payload',
        'conversions', 'recovery_queue', 'suppression_records', 'emails', 'attachments',
        'draft_edit_log', 'escalations', 'tool_call_log'
    ];
    -- Every within-schema FK in the common tables, as 'table|column|ref_table|ref_column'.
    -- Mirrors 004_create_common_tables_template.sql exactly. tool_call_log.lead_id is
    -- deliberately absent -- the source document never annotates it as an FK.
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
    -- Step 0: target schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema);

    -- Step 1: copy structure for all 21 common tables (columns, defaults,
    -- CHECK constraints, NOT NULL, PRIMARY KEY/UNIQUE, indexes -- NOT FKs).
    FOREACH v_tbl IN ARRAY v_common_tables LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I.%I (LIKE public.%I INCLUDING ALL)',
            v_schema, v_tbl, v_tbl
        );
    END LOOP;

    -- Step 2: copy structure for this archetype's specific table(s)
    FOREACH v_tbl IN ARRAY p_specific_tables LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I.%I (LIKE public.%I INCLUDING ALL)',
            v_schema, v_tbl, v_tbl
        );
    END LOOP;

    v_all_tables := v_common_tables || p_specific_tables;

    -- Step 3: explicitly add every within-schema FK (see header -- LIKE
    -- never copies these). Guarded against re-run: skips any FK whose
    -- constraint name already exists in this schema.
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

    -- Archetype-specific tables all FK conversion_id -> this schema's own conversions.
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

    -- Step 4: RLS is NOT part of LIKE's copyable state at all -- enable
    -- explicitly on every table in this schema, default-deny (zero policies).
    FOREACH v_tbl IN ARRAY v_all_tables LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v_schema, v_tbl);
    END LOOP;

    -- Step 5/6: defense-in-depth grant posture parity with public/control.
    -- Empirically NOT required for new schemas (see header) but applied
    -- anyway for a uniform, provably-correct baseline across every schema.
    FOREACH v_tbl IN ARRAY v_all_tables LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %I.%I FROM anon, authenticated', v_schema, v_tbl);
    END LOOP;
    EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA %I REVOKE ALL ON TABLES FROM anon, authenticated',
        v_schema
    );
END;
$$;

-- Pins search_path (fixes get_advisors WARN: function_search_path_mutable).
-- Safe because every object reference inside the function body is
-- explicitly schema-qualified (%I.%I) -- pg_catalog builtins (format(),
-- string_to_array()) are always implicitly searched regardless of
-- search_path. See 011_pin_template_assembly_function_search_path.sql.
ALTER FUNCTION public.create_archetype_template(text, text[]) SET search_path = '';
