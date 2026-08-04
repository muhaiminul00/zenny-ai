-- ============================================================================
-- 013_create_client_schema_from_template_function.sql
-- Phase C, Part 2 — Zenny Database Structure v4
-- Source: SQL_Phase_C_Instructions.md, Part 2, Step 2
--
-- Template-to-client schema copy function. NOT a reuse of
-- public.create_archetype_template — that function hardcodes the source
-- schema as the literal string 'public' in every `LIKE public.%I` call,
-- and derives the target schema name as 'tpl_' || p_archetype. Neither
-- fits client onboarding, which needs an arbitrary source
-- (tpl_{archetype}) and an arbitrary target (client_{id}_{slug}, not a
-- prefix-derived name). Confirmed by reading the deployed function
-- definition directly (pg_get_functiondef), not assumed.
--
-- Same empirically-learned lessons as create_archetype_template apply
-- here identically: LIKE ... INCLUDING ALL does not copy foreign keys or
-- RLS-enabled state, so both are re-applied explicitly after the copy.
-- Tested end-to-end against one throwaway client
-- (client_test_001_acme_emergency_test) — see
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
AS $$
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
$$;
