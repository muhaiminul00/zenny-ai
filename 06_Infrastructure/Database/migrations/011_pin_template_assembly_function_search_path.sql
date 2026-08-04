-- ============================================================================
-- 011_pin_template_assembly_function_search_path.sql
-- Phase B — Zenny Database Structure v3
-- Source: get_advisors (security) WARN, run after 010's 5-schema assembly
--
-- Fixes: function_search_path_mutable on public.create_archetype_template.
-- Safe because the function only ever references objects via explicit
-- schema-qualified identifiers (%I.%I) inside its dynamic SQL -- pg_catalog
-- builtins (format(), string_to_array()) are always implicitly searched
-- regardless of search_path. Verified by re-running the function against
-- an already-built schema (idempotent no-op) after applying this fix.
-- ============================================================================

ALTER FUNCTION public.create_archetype_template(text, text[]) SET search_path = '';
