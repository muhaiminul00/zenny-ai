-- ============================================================================
-- 010_assemble_all_templates.sql
-- Phase B — Zenny Database Structure v3
-- Source: SQL_Phase_B_Instructions.md, Requirement 1 (009's own header
-- names this file: "Invoked 5 times, once per archetype, in
-- 010_assemble_all_templates.sql")
--
-- RECONSTRUCTION NOTICE — this file was missing from the repository
-- (present neither in migrations/, migrations/FINAL/, nor Archive/) as of
-- the 2026-08-01 cross-architecture validation pass. It is reconstructed
-- here, not recovered as an original. The 5 SELECT calls below are
-- copied verbatim from `migrations/FINAL/current_state.sql` (its "6.
-- TEMPLATE SCHEMA ASSEMBLY" section, immediately following
-- `create_archetype_template`'s definition) — that content is directly
-- derived, not inferred. Everything else in this file (the header
-- commentary, comment style, and structure) is reconstructed by pattern-
-- matching sibling migrations 009 and 011, which both describe this
-- file's role and execution position but do not contain its body —
-- that part required judgment, not direct derivation, and should be
-- confirmed against any external backup before being treated as
-- byte-identical to the original.
--
-- Invokes public.create_archetype_template() (009) once per archetype,
-- building all 5 tpl_* template schemas (111 tables total: 22 emergency +
-- 23 commerce + 22 appointment + 22 consultation + 22 engagement). Must
-- run after 009 (function must exist) and before 011 (which pins the
-- function's search_path once the 5-schema assembly this file performs
-- is confirmed working, per 011's own header).
--
-- NOTE ON 'commerce': current_state.sql calls create_archetype_template
-- with the single archetype key 'commerce' (schema tpl_commerce), passing
-- both conversions_ecom and conversions_restaurant as its specific
-- tables — this predates the later commerce_ecom/commerce_restaurant
-- enum split (Phase A's resolution, referenced in
-- 012_schema_version_tracking.sql) and is reproduced here exactly as
-- current_state.sql has it, not corrected, since correcting it is a
-- schema-behavior change outside this reconstruction's scope.
-- ============================================================================

SELECT public.create_archetype_template('emergency', ARRAY['conversions_emergency']);
SELECT public.create_archetype_template('commerce', ARRAY['conversions_ecom', 'conversions_restaurant']);
SELECT public.create_archetype_template('appointment', ARRAY['conversions_appointment']);
SELECT public.create_archetype_template('consultation', ARRAY['conversions_consultation']);
SELECT public.create_archetype_template('engagement', ARRAY['conversions_engagement']);
