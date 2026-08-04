# SQL Migration — Phase B: Template Schema Assembly

```
Task:      Build the 5 tpl_* schemas by copying public's reference
           tables (21 common + 6 archetype-specific) into each.
Status:    Approved. Second of 3 phases (A: done, B: this, C: onboarding
           automation spec).
Source:    06_Infrastructure/Database/Database_Structure_v3.md §1-§2 —
           re-read the Schema Tree Overview and Build & Deployment
           Workflow sections before starting; this phase implements
           exactly what those sections specify.
```

---

## What This Phase Builds

```
public (reference scaffolding — permanent, never itself a template)
  │
  ├── 21 common tables  ──┐
  └── 6 archetype-specific ┤
                             ├──copy──> tpl_emergency     (21 common + conversions_emergency)
                             ├──copy──> tpl_commerce       (21 common + conversions_ecom + conversions_restaurant)
                             ├──copy──> tpl_appointment    (21 common + conversions_appointment)
                             ├──copy──> tpl_consultation   (21 common + conversions_consultation)
                             └──copy──> tpl_engagement     (21 common + conversions_engagement)
```

Each `tpl_*` schema gets **only its own archetype-specific table(s)** — `tpl_emergency` never gets `conversions_ecom`, etc. `tpl_commerce` is the one exception with 2 archetype-specific tables (Ecom + Restaurant sub-variants), per the frozen design doc.

**Structure only, no data.** These are templates — empty tables, correct schema, ready to be copied again at client onboarding (Phase C, not this phase).

---

## Requirements

### 1. Build This as a Reusable Script, Not a One-Time Manual Copy

Per §7's original Phase A note ("Template assembly should be a script/workflow, not manual copying — you'll rebuild the 5 templates whenever the common table structure changes"). This needs to be re-runnable, not a single manual pass.

**Approach:** write a SQL function or a documented, parameterized script (`create_archetype_template(archetype_name text, specific_tables text[])` or similar) that:
1. Creates the target `tpl_*` schema if it doesn't exist
2. Copies all 21 common table structures from `public` into it (structure only — `CREATE TABLE tpl_x.table_name (LIKE public.table_name INCLUDING ALL)` is the right Postgres pattern for this, since `INCLUDING ALL` carries over constraints, indexes, and defaults, not just column names)
3. Copies the correct archetype-specific table(s) for that template

Store this as a new migration file: `009_create_template_assembly_function.sql`, then invoke it 5 times (once per archetype) in `010_assemble_all_templates.sql`.

### 2. Enum Types Are Shared, Not Copied

Enum types created in `003_create_enum_types.sql` are database-wide (not schema-scoped in Postgres) — they do NOT need to be recreated per template schema. Confirm this is understood correctly; do not attempt to duplicate enum type definitions per schema.

### 3. Foreign Keys Within Each Template Must Resolve Correctly

`LIKE ... INCLUDING ALL` copies constraint *definitions*, but FK constraints reference specific tables — when copying `conversions_emergency` (which FKs to `conversions`) into `tpl_emergency`, the FK must point to `tpl_emergency.conversions`, not `public.conversions`. Verify this explicitly after each copy — this is the most likely place for a silent, wrong-schema FK to slip through.

### 4. RLS on Every Copy

Every table copied into every `tpl_*` schema needs RLS enabled with zero `anon`/`authenticated` policies — same default-deny posture as `public` and `control`. `LIKE ... INCLUDING ALL` does NOT carry over RLS enablement state in all Postgres versions — verify explicitly per table, do not assume it transferred.

### 5. Data API Exposure Check, Per Template

Given Phase A's finding that Supabase's default ACLs can silently grant `anon`/`authenticated` on new tables — check this explicitly for every table in every new `tpl_*` schema, the same way it was checked and fixed for `public`. Apply the same `ALTER DEFAULT PRIVILEGES` fix per new schema if the same auto-grant behavior appears (it likely will, since this seems to be a `postgres`-role-level default, not `public`-schema-specific — verify whether the fix needs to be schema-specific or was already handled globally by the earlier `ALTER DEFAULT PRIVILEGES FOR ROLE postgres` statement, which may or may not scope to new schemas automatically — this needs to be tested, not assumed).

### 6. Verification Per Template

For each of the 5 `tpl_*` schemas, after assembly, confirm via `information_schema`:
- Correct table count (22 for the 4 single-extension archetypes, 23 for `tpl_commerce`)
- All FKs resolve within the same schema (per Requirement 3)
- RLS enabled, zero policies, on every table (per Requirement 4)
- No `anon`/`authenticated` grants (per Requirement 5)

Run `get_advisors` after all 5 templates are built, same as Phase A's closing step.

---

## Constraints

1. `public` is never modified by this phase — only read from, to build the templates. Its reference-scaffolding status (established in the prior task) is permanent.
2. Templates never receive data in this phase — structure only.
3. Do not begin Phase C (client onboarding automation) under this prompt.
4. Follow the now-properly-installed `supabase` and `supabase-postgres-best-practices` skills' guidance throughout — this is a fresh session context, so skill discoverability should work correctly this time; confirm it does before proceeding, and flag clearly if it still doesn't.

---

## Deliverable

1. The reusable template-assembly function/script, as its own migration file.
2. Confirmation all 5 `tpl_*` schemas exist with the correct table counts.
3. Confirmation of Requirement 3 (FK resolution within-schema) for every archetype-specific table.
4. Confirmation of Requirement 4 (RLS) across all tables in all 5 schemas.
5. Confirmation of Requirement 5 (no Data API exposure) across all 5 schemas, including whether the earlier global ACL fix covered new schemas automatically or needed to be reapplied per schema.
6. `get_advisors` output after full assembly, and confirmation any flagged issues were fixed.
7. Confirmation of skill discoverability in this session (per Constraint 4).

STOP after Phase B is complete and verified. Await a separate prompt for Phase C.
