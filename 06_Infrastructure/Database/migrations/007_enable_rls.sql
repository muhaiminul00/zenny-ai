-- ============================================================================
-- 007_enable_rls.sql
-- Phase A — Zenny Database Structure v3
-- Source: 06_Infrastructure/Database/Database_Structure_v3.md, §6, Item 3
--
-- Default-deny for `anon`/`authenticated` on every table, in both the
-- Control schema and every template/client schema. RLS is enabled with
-- ZERO policies created — an enabled table with no matching policy denies
-- all access to roles that RLS applies to. `service_role` (used by n8n)
-- bypasses RLS entirely by Supabase's own design, so no explicit
-- service_role policy is needed or created.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Control-schema section (schema-qualified — applies once, to control.*)
-- ----------------------------------------------------------------------------
ALTER TABLE control.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.client_active_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.client_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.recovery_cadence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE control.sync_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Schema-agnostic section (no schema prefix — applies within whichever
-- tpl_*/client schema is active at execution time, per files 004/005)
-- ----------------------------------------------------------------------------

-- Common tables (21, file 004)
ALTER TABLE client_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_cadence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_handoff_payload ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_edit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_call_log ENABLE ROW LEVEL SECURITY;

-- Archetype-specific tables (6, file 005) — in Phase B, only the
-- archetype-relevant subset actually exists in a given tpl_* schema, so
-- only the matching ALTER TABLE statements below apply there. Included
-- here in full since this file is schema-agnostic like 004/005; Phase B's
-- assembly script is responsible for applying only the relevant lines,
-- consistent with how it applies only the relevant table(s) from file 005.
ALTER TABLE conversions_emergency ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions_ecom ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions_restaurant ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions_appointment ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions_engagement ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Defense-in-depth: revoke the table-level grants Supabase's default
-- privileges automatically give anon/authenticated on new PUBLIC-schema
-- tables. Discovered during this migration's RLS/security checklist pass —
-- unlike `control` (which has zero grants by default, since Supabase only
-- auto-grants on `public`), these 27 tables previously had full CRUD
-- grants to anon/authenticated, reachable via the Data API and blocked
-- only by RLS's zero-policy default-deny. This brings them to the same
-- "never granted at all" posture as control, matching the design
-- principle that the real gate is absence of grants, not RLS alone.
-- ----------------------------------------------------------------------------
REVOKE ALL PRIVILEGES ON TABLE
  client_config, templates, email_categories, recovery_cadence_profiles,
  kb_entries, customers, channel_identity_links, customer_preferences,
  active_issues, leads, complaints, growth_events, growth_handoff_payload,
  conversions, recovery_queue, suppression_records, emails, attachments,
  draft_edit_log, escalations, tool_call_log,
  conversions_emergency, conversions_ecom, conversions_restaurant,
  conversions_appointment, conversions_consultation, conversions_engagement
FROM anon, authenticated;
