-- ============================================================================
-- 012_schema_version_tracking.sql
-- Phase C, Part 1 — Zenny Database Structure v4
-- Source: SQL_Phase_C_Instructions.md, Part 1
--
-- Per-client template version tracking + a version log for the templates
-- themselves. Lets control.clients.template_version tell you, per client,
-- whether they're on the current tpl_{archetype} structure or need the
-- manual migration process (Template_Migration_Process.md) applied.
-- ============================================================================

ALTER TABLE control.clients
  ADD COLUMN IF NOT EXISTS template_version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS template_archetype_at_onboarding archetype_enum;

CREATE TABLE IF NOT EXISTS control.template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype archetype_enum NOT NULL,
  version int NOT NULL,
  change_description text NOT NULL,
  applied_to_public boolean NOT NULL DEFAULT true,
  created_date date NOT NULL DEFAULT current_date,
  CONSTRAINT template_versions_unique UNIQUE (archetype, version)
);

ALTER TABLE control.template_versions ENABLE ROW LEVEL SECURITY;

-- Seeded for all 6 archetype_enum values, not "5 archetypes" literally —
-- archetype_enum has no bare 'commerce' value (split into commerce_ecom /
-- commerce_restaurant per Phase A's resolution), and this table is
-- enum-keyed, so a literal 'commerce' insert isn't possible. commerce_ecom
-- and commerce_restaurant are tracked as independent peer rows here,
-- consistent with how they're already tracked independently in
-- archetype_settings and leads.archetype elsewhere in this design — both
-- share the single tpl_commerce schema, so in practice they'll always be
-- versioned together, but the enum-keyed table structure requires two rows
-- to represent that correctly.
INSERT INTO control.template_versions (archetype, version, change_description)
VALUES
  ('emergency', 1, 'Initial Phase A/B build'),
  ('commerce_ecom', 1, 'Initial Phase A/B build'),
  ('commerce_restaurant', 1, 'Initial Phase A/B build'),
  ('appointment', 1, 'Initial Phase A/B build'),
  ('consultation', 1, 'Initial Phase A/B build'),
  ('engagement', 1, 'Initial Phase A/B build')
ON CONFLICT (archetype, version) DO NOTHING;
