-- ============================================================================
-- 008_public_schema_scaffolding_marker_and_hardening.sql
-- Pre-Phase-B fix — Corrections_and_PhaseA_MCP_Execution.md follow-up
-- Source: Pre-Phase-B Fixes — Skills Installation + `public` Schema Role
--         Clarification (task instructions), Fix 2
--
-- Clarifies and enforces public's role as PERMANENT REFERENCE SCAFFOLDING:
-- holds the canonical 21 common + 6 archetype-specific table structures
-- Phase B copies FROM to build tpl_emergency/tpl_commerce/tpl_appointment/
-- tpl_consultation/tpl_engagement. public is never itself a template,
-- never copied into a live client schema, never receives real application
-- traffic, and is never renamed.
-- ============================================================================

COMMENT ON SCHEMA public IS 'Zenny Phase A reference scaffolding ONLY. Holds the canonical 21 common + 6 archetype-specific table structures Phase B copies FROM to build tpl_emergency/tpl_commerce/tpl_appointment/tpl_consultation/tpl_engagement. Never itself a template, never copied into a live client schema, never receives real application traffic. RLS enabled + zero anon/authenticated grants on every table, same default-deny posture as the control schema.';

-- Defense-in-depth: re-applies (idempotently) the anon/authenticated
-- REVOKE from file 007 — Supabase's default privileges had silently
-- granted these roles full CRUD on every public table, found during
-- Phase A's RLS/security checklist pass. Restated here as this file's own
-- self-contained baseline.
REVOKE ALL PRIVILEGES ON TABLE
  client_config, templates, email_categories, recovery_cadence_profiles,
  kb_entries, customers, channel_identity_links, customer_preferences,
  active_issues, leads, complaints, growth_events, growth_handoff_payload,
  conversions, recovery_queue, suppression_records, emails, attachments,
  draft_edit_log, escalations, tool_call_log,
  conversions_emergency, conversions_ecom, conversions_restaurant,
  conversions_appointment, conversions_consultation, conversions_engagement
FROM anon, authenticated;

-- Closes the recurrence path: without this, any NEW table later created in
-- public by the postgres role (the role our DDL runs as, via MCP) would
-- silently reacquire anon/authenticated grants through Supabase's default
-- ACL for the public schema. The matching supabase_admin-owned default ACL
-- entry could NOT be altered here (ERROR 42501: permission denied to
-- change default privileges) -- that entry is Supabase's own
-- internally-managed system role and only applies to objects supabase_admin
-- itself creates, not to anything this project creates.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
