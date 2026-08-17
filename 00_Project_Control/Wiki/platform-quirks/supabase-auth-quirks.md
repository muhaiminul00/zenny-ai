# Supabase Auth (GoTrue) Quirks

**Status:** current as of 2026-08-05 (BC-015)

## What's true now

**Directly inserting a Supabase Auth user via raw SQL against
`auth.users`/`auth.identities` (rather than the Admin API) can produce a
real GoTrue 500 error on first login if certain columns are left `NULL`
instead of an empty string.** Real symptom hit: `"Database error
querying schema"` on the first real login attempt after a direct-SQL
user insert. Root cause: GoTrue scans several `auth.users` token columns
expecting them to be non-nullable in practice (even where the schema
technically allows `NULL`) — a known platform quirk, not a mistake in
the insert's intent. Fix: use `''` (empty string) rather than `NULL` for
these columns.

This path (direct SQL + `pgcrypto`'s `crypt()` for the password hash) was
used specifically because no Admin API service-role key is exposed via
any available MCP tool in this environment — it is a workaround for a
tooling gap, not the preferred way to create an Auth user when the Admin
API is actually available.

## Why (if a non-obvious decision)

Not a deliberate design choice — this is purely an artifact of GoTrue's
own internal expectations not perfectly matching what the `auth.users`
schema technically permits. Worth knowing before assuming any raw-SQL
auth-user creation is safe to copy-paste without adapting the NULL
handling.

## Gotchas

- If a future session needs to create a test Auth user without Admin
  API access, use empty strings (not `NULL`) for the relevant token
  columns from the start — don't rediscover this via a live 500 first.
- A direct SQL password reset for an existing Auth user
  (`auth.users.encrypted_password`) has been correctly BLOCKED by the
  Claude Code auto-mode permission classifier on at least one later
  session (BC-032) as a genuine security boundary — this is expected
  behavior, not a bug to work around. If login is needed and no
  persisted browser session exists, ask the human for real credentials
  rather than attempting a direct `auth.users` write.

## Source

- `Phase 5 — 5B Order Lookup Dashboard (BC-015 — BUILT + DEPLOYED)` (log.md, 2026-08-05)
- `Session Log — Session 32 — BC-032 (Infrastructure catch-up)...` (log.md, 2026-08-07)
