# FINAL — Current-State Reference Snapshot

## Approach: (b), not (a)

Per `Final_Documentation_Instructions.md`, two approaches were offered:
- (a) Renumber/consolidate the migration files into a fresh set.
- (b) Keep `001`–`011` as the historical, already-applied migration record; add one new current-state snapshot.

**Chose (b).** Every one of `001`–`011` already exists as a real entry in Supabase's own migration history (`supabase_migrations.schema_migrations`, visible via `list_migrations`) — they were genuinely applied via `apply_migration`, in order, including two real corrections (`recovery_cadence_profiles`'s PK redesign, the 2 added FKs) that happened as their own distinct steps after the original design was found to have a bug. Renumbering or rewriting that into a single clean "fresh" set would erase a true record of what actually happened and when, for no benefit — the database doesn't care how many files describe it, and a future engineer debugging "why does this table look different from `Database_Structure_v3.md`" is better served by an intact history showing the correction as a real, dated step than by a rewritten file that makes it look like the corrected version was there from the start.

Files `001`–`011` in the parent `migrations/` directory are **not modified** by this deliverable.

## What's Here

`current_state.sql` — a single, complete, dependency-ordered SQL file reflecting the database **exactly as verified live** on 2026-07-17, via direct `information_schema`/`pg_catalog` queries against the `zenny-vault` project (not reconstructed from memory of task reports). It is NOT a new migration to be applied — running it against a fresh database would work (it's valid, ordered DDL), but its purpose here is as the authoritative "this is what's actually there" reference, superseding the need to mentally apply `001`+corrections+`008`+`009`+`010`+`011` on top of each other to figure out current state.

### Why not a literal `pg_dump`/`supabase db pull`

Neither `pg_dump` nor `psql` is installed in this environment, and only MCP-mediated access to the database is available (no direct Postgres connection string/credentials) — confirmed by checking `which pg_dump`/`which psql` (both absent) before writing this file. A genuine `supabase db pull --local` also isn't usable here (see Phase A's findings: no linked local Supabase project, Docker daemon not running). `current_state.sql` is the practical equivalent achievable in this environment: every statement in it was verified against live `information_schema.columns`, `pg_catalog.pg_constraint`, `pg_catalog.pg_type`/`pg_enum`, `pg_indexes`, and `pg_policies` queries run directly against the project — not hand-copied from the original migration files, though it matches them exactly (which is itself a confirmation those files are accurate).

### Verification method

For each table, a column-signature query (name, data type, UDT name, nullability) was run against the live database and cross-checked. For enums, `pg_enum`/`pg_type` were queried directly (42 project enums confirmed, distinct from Supabase's 12 platform-internal enums). For indexes, `pg_indexes` was queried (26 total: 22 in `public`, 4 in `control`). For RLS/grants, `pg_class.relrowsecurity`, `pg_policies`, and `information_schema.role_table_grants` were queried across all 7 schemas. See `Database_Structure_v4_FINAL.md` for the full reconciled documentation this snapshot supports.

## 2026-08-01 update — migrations 010, 012, 013

The cross-architecture validation pass on 2026-08-01 found two problems with this snapshot, now addressed:

1. **`010_assemble_all_templates.sql` was missing from the parent `migrations/` directory entirely** — referenced by name in `009`'s header but never present on disk. Its content was always fully preserved here, in `current_state.sql`'s Section 6 (the 5 `create_archetype_template` calls), so nothing was actually lost — but the standalone numbered file is part of the historical record described above (Approach (b)) and its absence broke that record. It has been reconstructed in `migrations/010_assemble_all_templates.sql`, transcribing Section 6's content verbatim and reconstructing the header commentary by pattern-matching `009`/`011`. See that file's own header for the full reconstruction notice — it is a reconstruction, not a recovered original.
2. **This snapshot predated migrations `012_schema_version_tracking.sql` and `013_create_client_schema_from_template_function.sql`**, both applied ~25–30 minutes after the 2026-07-17 10:15 snapshot was taken. `current_state.sql` has been updated (Section 3 additions: `control.clients.template_version`/`.template_archetype_at_onboarding`, `control.template_versions`; new Section 7: `create_client_schema_from_template`) to include both, transcribed directly from the migration files. This transcription has **not** been re-verified live against `pg_catalog` the way the original 2026-07-17 content was — a live re-verification pass is recommended before treating this file as byte-for-byte current again.
