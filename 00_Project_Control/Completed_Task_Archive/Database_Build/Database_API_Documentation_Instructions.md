# Database API Documentation — Task Instructions

```
Task:      Document the full API/connection surface for this schema-
           based Supabase database, so n8n work never needs to come
           back to the database layer to figure out "how do I connect
           to this."
Status:    Approved. Runs before the n8n scan-and-plan pass.
Also includes: the manual Exposed-Schemas step-by-step guide (Step 3
           from Phase C), handed off as a real builder-facing procedure,
           with automation explicitly marked optional/deferred.
```

---

## Why This Matters Specifically for This Project

This isn't generic "here's how to use Supabase's API" documentation — it needs to solve the specific problem this schema-per-client design creates: **one API endpoint, many schemas, and PostgREST needs to be told which schema to target on every single call.** Get this wrong in an n8n workflow and it silently queries the wrong client's data or fails outright. This document is what prevents that.

---

## Create: `06_Infrastructure/Database/Database_API_Reference.md`

### Section 1 — Connection Basics

- The project's base API URL and where to find it (Dashboard location, not the literal value — this is a reference doc, not a secrets store)
- `anon` key vs `service_role` key — when each is used. Confirm explicitly: **n8n uses `service_role` exclusively** for all workflow operations, per the RLS design (default-deny for `anon`/`authenticated`, `service_role` bypasses RLS). State this as a hard rule, not just a note.
- Where/how the `service_role` key should be stored in n8n (credential store, not hardcoded in individual workflow nodes) — reference the existing n8n credential-management convention if one is already established in the old n8n docs; otherwise state this as the required pattern going forward.

### Section 2 — Schema Targeting (the core of this document)

This is the most important section — document precisely, with real examples:

- **How `Accept-Profile` (GET/HEAD requests) and `Content-Profile` (POST/PATCH/PUT/DELETE requests) headers select the target schema** — the actual mechanism, not just "it exists." Include a real example request against one of the actual tables in this database (e.g., targeting `client_test_001_acme_emergency_test.leads` if that test client schema still exists, or `control.clients` as a safe universal example).
- **In n8n specifically:** how to set these headers in an HTTP Request node, and how to do it in a Postgres/Supabase node if n8n's native node supports schema selection differently than raw headers.
- **The parameterization pattern:** since workflows must be schema-name-parameterized (not hardcoded per client, per the standing project requirement), document exactly how a workflow reads `control.clients.client_schema_name` and uses that value to set the header/parameter dynamically for that specific execution — with a concrete example workflow snippet or pseudocode, not just the concept.
- **Which schemas are actually exposed right now** vs. which require the manual Step 3 process (Section 4) before they're reachable via this mechanism at all.

### Section 3 — Practical Query Patterns for This Schema

Real, copy-adaptable examples for the operations n8n will actually need to perform constantly:
- Insert a new `lead` into a specific client's schema
- Query `control.client_config` for a client's current settings (including reading `archetype_settings` JSONB and extracting a specific archetype's sub-object)
- Call `create_client_schema_from_template` (the Phase C function) via the API, if that's ever needed outside of MCP-driven onboarding
- Query across `tool_call_log` for a specific state (e.g., all `WAITING` calls older than N minutes — relevant to the Action Tool Execution Contract's TIMEOUT handling)

### Section 4 — Manual Exposed-Schemas Procedure (Step-by-Step, Builder-Facing)

**This must be usable by a builder who was not part of designing this system** — assume no prior context beyond basic Supabase Dashboard familiarity. Confirmed as genuinely manual for now (no MCP tool or `pgrst.db_schemas` GUC path exists, per Phase C's empirical finding) — write the real Dashboard click-path.

```
1. [Exact Dashboard navigation path to the schema-exposure setting]
2. [Exact steps to add a new schema name to the exposed list]
3. [How to verify the schema is now reachable via Accept-Profile —
   a real test call to confirm, not just "it should work now"]
4. [What to do if it doesn't appear / troubleshooting]
```

Include a clear callout at the top of this section:
```
STATUS: Manual step, required for every new client onboarding.
Automation is planned as an optional, end-of-n8n-build task — not
required for initial client onboarding to work. Do not block onboarding
on automating this.
```

### Section 5 — Rate Limits & Connection Management (n8n-Specific)

- Restate the transaction-mode pooler requirement (already established) with the actual connection string pattern to use from n8n
- Any request-rate considerations relevant to a system with many client schemas potentially receiving simultaneous conversations — reference whatever Supabase's actual current limits are (verify current, don't rely on possibly-stale figures from earlier research in this project — a quick check is warranted since pricing/limits pages change)

### Section 6 — Cross-References

Point to the documents this one complements rather than duplicating their content:
- `Database_Structure_v4_FINAL.md` (schema structure)
- `Supabase_MCP_Implementation_Notes.md` (what was learned building this, MCP-specific — distinct from this document's focus on the ongoing operational API surface)
- `Tool_Naming_Convention.md` (how n8n tool/webhook names should be structured, separate from schema targeting)
- `Client_Onboarding_Guide.md` (the business-process side of onboarding, this document covers the technical/API side)

---

## Constraints

1. This is documentation only — no schema changes, no new database objects, except if a genuinely missing small helper (e.g., a convenience view) becomes obviously necessary while writing real query examples. If that happens, flag it as a suggestion rather than building it under this task.
2. Verify claims against the live database/API where practical (e.g., actually test an Accept-Profile request against a real table) rather than writing from memory/assumption — same discipline as every prior phase.
3. Do not begin the n8n scan-and-plan pass under this task.

---

## Deliverable

1. `Database_API_Reference.md`, all 6 sections complete.
2. Confirmation that Section 2's Accept-Profile/Content-Profile example was actually tested against the live project, not just described theoretically.
3. Confirmation of current Supabase rate/connection limits (re-verified, not assumed from earlier research in this project).
4. Any suggested-but-not-built helper objects, if any arose while writing Section 3's examples.

STOP after this document is complete. Await a separate prompt for the n8n scan-and-plan pass.
