# Corrections + Phase A Execution via MCP — Task Instructions

```
Task:      Apply 2 design corrections to the Phase A migration files,
           then EXECUTE Phase A against the connected Supabase project
           (not just generate files — actually run them, self-verify).
Status:    Approved. The supabase and supabase-postgres-best-practices
           skills are now installed and should activate automatically
           for this work — follow their guidance throughout, especially
           the CLI/MCP iteration workflow and the pre-commit advisor check.
Connection: Supabase connector already active in this environment,
           confirmed working against [CONFIRM: dev/staging project].
```

---

## Part 1 — Corrections to Existing Migration Files

### Correction 1: `recovery_cadence_profiles` PK Fix

**In file `002_create_control_tables.sql`**, replace `control.recovery_cadence_profiles`'s definition:

```sql
-- BEFORE (broken — 2-column PK cannot hold both a default row and
-- per-client override rows for the same archetype+step):
--   PRIMARY KEY (archetype, step_number)
--   client_id uuid NULL  -- null = default, non-null = override

-- AFTER (corrected):
CREATE TABLE control.recovery_cadence_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype archetype_enum NOT NULL,
  step_number int NOT NULL,
  delay_from_previous_step int NOT NULL,
  delay_unit delay_unit_enum NOT NULL,
  client_id uuid NULL REFERENCES control.clients(client_id),
  -- Enforces: a client may have at most ONE override row per archetype+step
  CONSTRAINT recovery_cadence_client_override_unique
    UNIQUE (archetype, step_number, client_id)
);

-- Enforces: exactly ONE default row (client_id IS NULL) per archetype+step.
-- A regular UNIQUE constraint would NOT catch this, since Postgres treats
-- each NULL as distinct for uniqueness purposes — a partial index is the
-- correct fix.
CREATE UNIQUE INDEX recovery_cadence_default_unique
  ON control.recovery_cadence_profiles (archetype, step_number)
  WHERE client_id IS NULL;
```

**In file `004_create_common_tables_template.sql`**, simplify the LOCAL copy — it does NOT need `client_id` at all, since by the time this table is synced into one specific client's schema, the default-vs-override merge has already happened (the local copy holds the one resolved row per archetype+step for that client):

```sql
-- Local (synced) copy — already resolved per-client, no override tracking needed here
CREATE TABLE recovery_cadence_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype archetype_enum NOT NULL,
  step_number int NOT NULL,
  delay_from_previous_step int NOT NULL,
  delay_unit delay_unit_enum NOT NULL,
  CONSTRAINT recovery_cadence_local_unique UNIQUE (archetype, step_number)
);
```

**Note this simplification in your completion report** — the sync workflow (Phase C, not this phase) is now responsible for resolving default-vs-override into one row per archetype+step when writing to a client's local copy, rather than the local table tracking both.

### Correction 2: Add Missing FKs

**In file `002_create_control_tables.sql`:**
- `control.email_categories.client_id` → add `REFERENCES control.clients(client_id)` (nullable FK — null still means universal default, matching `templates.client_id`'s existing pattern)
- `control.recovery_cadence_profiles.client_id` → already added above in Correction 1

---

## Part 2 — Execute Phase A via MCP (Not Just Generate Files)

**This is a change from the original Phase A task** — previously the deliverable was SQL files for manual execution. Now, with MCP connected and the Supabase skills active, actually run this against the connected project.

Follow the `supabase` skill's documented workflow exactly:

1. **Before starting:** fetch `https://supabase.com/changelog.md`, scan for breaking changes relevant to schema/RLS/enum work. Confirm nothing in our plan conflicts with current Supabase behavior.

2. **Iterate using `execute_sql` (MCP), not `apply_migration`.** Per the skill: `apply_migration` writes a migration history entry on every call, which prevents iteration. Use `execute_sql` freely while building and fixing the 7 files (with the 2 corrections above applied), testing as you go.

3. **Execute in correct dependency order** (per the existing header-comment note from the original Phase A report): `001 → 003 → 002 → 004 → 005 → 006 → 007` — enum types before the tables that use them.

4. **Self-verify structurally after each file**, not just at the end: query `information_schema.tables` / `information_schema.columns` to confirm each table matches the spec exactly (right columns, right types, right nullability) before moving to the next file.

5. **Run the RLS/security checklist from the `supabase` skill explicitly** before finalizing — specifically:
   - Confirm every table in `control` has RLS enabled with zero `anon`/`authenticated` policies (default-deny, per our design)
   - Confirm `service_role` access works as expected (should bypass RLS by default — verify this is actually true in this project, don't just assume)
   - Note: since these tables are NOT being exposed via Data API grants to `anon`/`authenticated` (per our design — only `service_role`/n8n touches this), the skill's Data API exposure warning (§4) is not a bug here, it's the intended behavior — RLS is defense-in-depth, the real gate is that `anon`/`authenticated` were never granted table access at all. Confirm this is actually the case.

6. **Run `supabase db advisors` (or MCP `get_advisors`) before declaring Phase A complete.** Fix anything it flags. This is the skill's own "when ready to commit" step — treat it as mandatory, not optional, for this task.

7. **Generate the clean migration** once everything is verified: per the skill's workflow, use `supabase db pull <descriptive-name> --local --yes` (or the declarative-schema equivalent if this project uses `supabase/schemas/` — check which workflow applies first) to produce the actual versioned migration history, not just leave changes applied ad hoc via `execute_sql`.

---

## Constraints

1. Apply both corrections before executing anything — do not run the old, broken `recovery_cadence_profiles` definition even temporarily.
2. Follow the `supabase` and `supabase-postgres-best-practices` skills' guidance throughout — if either skill's guidance conflicts with something in this instructions file, flag the conflict rather than silently picking one.
3. Confirm which Supabase project this is connected to before executing anything destructive/structural — should be dev/staging, not a project with real client data. If you cannot confirm this, stop and ask rather than assuming.
4. Do not proceed to Phase B (template assembly) under this prompt.

---

## Deliverable

1. Confirmation of both corrections applied to the SQL files.
2. Confirmation of which Supabase project this executed against.
3. Execution log — confirmation each of the 7 files ran successfully, in the correct dependency order.
4. Structural self-verification results (tables/columns match spec).
5. RLS/security checklist confirmation (per Part 2, step 5).
6. `db advisors` / `get_advisors` output, and confirmation any flagged issues were fixed.
7. Confirmation of which schema-change workflow this project uses (declarative vs. imperative) and that a clean migration was generated accordingly.

STOP after Phase A is fully executed and verified. Await a separate prompt for Phase B.
