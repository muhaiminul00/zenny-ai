# Migrations

Applies `Database_Structure_v3.md` to the connected Supabase project (`zenny-vault`). Files 001–007 are Phase A (schema, Control tables, enum types, and the schema-agnostic common/archetype-specific table + index + RLS templates). File 008 is a pre-Phase-B hardening/marker fix. Execution order is `001 → 003 → 002 → 004 → 005 → 006 → 007 → 008` — see 001's header for why 003 runs before 002 despite the numbering.

## `public` schema — reference scaffolding only

Files 004–007 are schema-agnostic (no schema prefix) so they can be applied inside any schema. Phase A ran them once, unqualified, landing in `public` — this is the canonical reference instance of the 21 common + 6 archetype-specific table structures.

**`public` is permanent reference scaffolding, not a live schema:**
- It is never renamed and never becomes a 6th "template."
- It is never copied into a live client schema and never receives real application traffic.
- Phase B copies these table structures **from** `public` into each of the 5 `tpl_*` schemas (`tpl_emergency`, `tpl_commerce`, `tpl_appointment`, `tpl_consultation`, `tpl_engagement`).
- It carries the same default-deny posture as `control`: RLS enabled with zero policies on every table, and zero `anon`/`authenticated` grants (Supabase's default privileges silently grant these to new `public` tables — this was found and revoked during Phase A's security checklist pass, then hardened further in `008` by revoking the `postgres`-role default ACL for future tables too, so the exposure can't quietly reappear).

This is also recorded as a `COMMENT ON SCHEMA public` in the database itself (see `008_public_schema_scaffolding_marker_and_hardening.sql`).

## `control` schema

The Control Plane (`vault` renamed to `control` — see `Corrections_and_PhaseA_MCP_Execution.md`). Manually editable, source of truth, synced down to client schemas. Same RLS/grant posture as `public`.
