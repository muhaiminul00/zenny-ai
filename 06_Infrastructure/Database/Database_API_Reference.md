# Database API Reference

```
Status:    Operational reference for the n8n build. Written before n8n
           work starts so that work never needs to come back to the
           database layer to answer "how do I connect to this."
Project:   zenny-vault (Supabase), region ap-northeast-2, Postgres 17.
Scope:     The API/connection surface — how to reach this schema-per-
           client database from outside. NOT the schema structure
           itself (see Database_Structure_v4_FINAL.md) and NOT what
           was learned building it (see Supabase_MCP_Implementation_
           Notes.md). See §6 for the full map of related documents.
```

---

## The Core Problem This Document Solves

This is a schema-per-client design: one Supabase project, one API endpoint, but dozens of schemas (`control`, `public`, 5 `tpl_*` templates, and one live schema per onboarded client). PostgREST — the Data API layer Supabase exposes over REST — defaults to the `public` schema on every request unless told otherwise. **Every single call an n8n workflow makes must explicitly say which schema it means**, via the `Accept-Profile`/`Content-Profile` headers documented in §2. Get this wrong and a workflow either fails outright or — worse — silently reads or writes a different client's schema than intended, because the header was missing, hardcoded to the wrong value, or not parameterized per execution. This document exists specifically to prevent that class of bug.

---

## 1. Connection Basics

### Base API URL

Every request goes to your project's REST endpoint: `https://{project-ref}.supabase.co/rest/v1/{table}`. Find your project's exact URL in the **Supabase Dashboard → Project Settings → API → Project URL** (or **Connect** button at the top of any project page). This document doesn't print the literal URL — it's not a secret, but treat this as a reference doc, not a config store; pull the live value from the Dashboard when configuring n8n, not from a copy pasted into documentation that can go stale.

### `anon` key vs `service_role` key

| Key | Bypasses RLS? | Used by |
|---|---|---|
| `anon` (publishable) | No | Nothing in this project. No client-facing app exists yet that would use it. |
| `service_role` (secret) | **Yes** | **n8n, exclusively — for every workflow operation, no exceptions.** |

**Hard rule, not a suggestion: n8n uses `service_role` exclusively.** This isn't a convenience choice — it's a direct consequence of the RLS design verified throughout Phase A/B/C: every table in every schema (`control`, `public`, all `tpl_*`, and every future client schema) has RLS enabled with **zero policies**, which is default-deny for any role RLS applies to. `anon` and `authenticated` are also confirmed to have **zero table grants** anywhere in this database (checked directly, not assumed — see `Supabase_MCP_Implementation_Notes.md` §2). A request using the `anon` key against any table in this system will fail with a permission error — this was verified live while writing this document (§2 below shows the actual response). `service_role` is the only role with `rolbypassrls = true`, and therefore the only role that can do anything here. If an n8n node is ever found using the `anon`/publishable key for a data operation, that's a bug, not a valid alternate path.

### Where the `service_role` key lives in n8n

**Store it in n8n's credential store as a Supabase/HTTP credential — never hardcoded into an individual workflow node's parameters, header field, or expression.** This project has no prior n8n credential-management convention on record to inherit (no existing n8n docs describe one), so this is stated here as the required pattern going forward: one credential entry, referenced by every workflow/node that needs it, so the key can be rotated in one place without hunting through every workflow for a hardcoded copy.

---

## 2. Schema Targeting (Read This Before Building Any n8n Node)

### The mechanism

PostgREST selects which Postgres schema a request targets via two headers, chosen by HTTP method:
- **`Accept-Profile`** — for `GET`/`HEAD` requests (reads).
- **`Content-Profile`** — for `POST`/`PATCH`/`PUT`/`DELETE` requests (writes).

Omit the header entirely and PostgREST defaults to `public`. This is not a fallback you want to rely on implicitly — every node touching a client schema must set the header explicitly, every time, even if it happens to match the default in a given case.

### Real, tested example — not theoretical

Tested live against this project (2026-07-17) using the `anon` key, to demonstrate both the header mechanism and what happens when a schema isn't exposed yet (§4):

**Request 1 — targeting `control` (not exposed):**
```
GET /rest/v1/clients?select=client_id,business_name&limit=1
Host: {project-ref}.supabase.co
apikey: {key}
Authorization: Bearer {key}
Accept-Profile: control
```
**Actual response:** `406 Not Acceptable`
```json
{"code":"PGRST106","details":null,"hint":"Only the following schemas are exposed: public, graphql_public","message":"Invalid schema: control"}
```
This is the exact, real error PostgREST returns for an unexposed schema — a clean, specific `PGRST106`, not a generic failure. If an n8n workflow ever throws this, the fix is always §4, never a code change.

**Request 2 — targeting `public.leads` with `anon` (no `Accept-Profile` needed, `public` is the default), demonstrating the RLS/grant hard-deny from §1:**
```
GET /rest/v1/leads?select=lead_id&limit=1
apikey: {anon key}
Authorization: Bearer {anon key}
```
**Actual response:** `401 Unauthorized`
```json
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT SELECT ON public.leads TO anon;","message":"permission denied for table leads"}
```
This confirms §1's hard rule empirically, not by assertion — `anon` cannot read this table at all, at the grant level, before RLS even enters into it.

**Request 3 — targeting the test client's own schema (also not yet exposed):**
```
GET /rest/v1/leads?select=lead_id&limit=1
Accept-Profile: client_test_001_acme_emergency_test
```
**Actual response:** same `PGRST106` as Request 1. This is the concrete link to §4: a client schema being successfully created (Phase C, Step 2) does **not** make it reachable via the Data API — Step 3 (Exposed Schemas registration) is a separate, required, currently-manual action, and this is what its absence looks like from the API's perspective.

### Setting these headers in n8n

- **HTTP Request node:** add `Accept-Profile` (GET/HEAD) or `Content-Profile` (POST/PATCH/PUT/DELETE) as a custom header, value set from an expression (see parameterization pattern below) — not a literal string.
- **Supabase/Postgres native node (if used instead of raw HTTP):** check whether the installed node version exposes a schema/profile parameter directly. As of writing, n8n's native Supabase node historically has limited or no built-in schema-selection support beyond `public` — if that's still true when the n8n build starts, use the **HTTP Request node** for any operation touching a non-`public` schema, so the headers can be set explicitly. Confirm the installed node's actual current capability at build time rather than assuming from this note, since n8n node capabilities change between versions — this is exactly the kind of claim to re-verify empirically, per this project's own standing discipline.

### The parameterization pattern (concrete, not conceptual)

Workflows must never hardcode a schema name per client — one workflow definition serves every client, parameterized at execution time. Concretely:

1. **Trigger/input** supplies (or a prior node looks up) the `client_id` for this execution.
2. **A node queries `control.clients`** (itself targeted via `Accept-Profile: control`) to resolve `client_schema_name`:
   ```
   GET /rest/v1/clients?select=client_schema_name&client_id=eq.{client_id}
   Accept-Profile: control
   ```
3. **Every subsequent node in the workflow** that touches this client's own data sets `Accept-Profile`/`Content-Profile` from an n8n expression referencing that lookup's result — e.g. (pseudocode, actual expression syntax depends on the node output reference):
   ```
   Accept-Profile: {{ $node["Get Client Schema"].json.client_schema_name }}
   ```
   Never a literal schema name typed into the header field. This is what makes the workflow schema-name-parameterized rather than hardcoded — the header value is always a runtime lookup result, resolved fresh on every execution, for whichever client that execution is actually for.

### Which schemas are exposed right now

Confirmed live (2026-07-17, via the test requests above): **only `public` and `graphql_public` are currently exposed.** `control`, all 5 `tpl_*` template schemas, and the one existing client schema (`client_test_001_acme_emergency_test`) are **not** reachable via the Data API yet — every one of them requires §4's manual procedure first. This matters immediately: even though Phase C's onboarding sequence successfully creates a client's schema (Step 2) and populates it (Step 5), that schema is invisible to any n8n workflow using the Data API until someone completes §4 for it. Don't assume a freshly-onboarded client is reachable — verify, or better, make §4 a hard, checked gate before Step 8 (n8n connection) begins for that client, exactly as Phase C's own spec already requires.

---

## 3. Practical Query Patterns for This Schema

All patterns below use `service_role` conceptually (the only role that can actually execute them, per §1) via PostgREST syntax. The underlying SQL logic in each was verified directly against the live database while writing this document; the literal `service_role`-authenticated HTTP calls were not additionally re-executed here, since that credential is intentionally not something this documentation task has or needed direct access to — the SQL semantics are proven, the wrapping HTTP layer is standard PostgREST syntax.

### Insert a new `lead` into a specific client's schema

```
POST /rest/v1/leads
Content-Profile: {client_schema_name}
Prefer: return=representation
Content-Type: application/json

{
  "customer_id": "{uuid}",
  "archetype": "emergency",
  "intent": "burst pipe, active leak",
  "source_channel": "website",
  "conversation_summary": "Customer reports active water leak, needs immediate dispatch.",
  "status": "new",
  "validation_flag": false,
  "created_date": "2026-07-17",
  "last_interaction": "2026-07-17"
}
```
`Content-Profile`, not `Accept-Profile` — this is a write. `customer_id` must already exist in that same client schema's `customers` table (FK, verified live throughout Phase B/C to resolve within-schema, never cross-schema).

### Query `control.client_config` for a client's settings, including a specific archetype's sub-object

Verified live against the actual test client's row:
```
GET /rest/v1/client_config?select=client_id,archetype_settings&client_id=eq.{client_id}
Accept-Profile: control
```
Returns the full `archetype_settings` JSONB blob. To extract one archetype's sub-object specifically, use PostgREST's JSON path selection syntax:
```
GET /rest/v1/client_config?select=client_id,emergency_settings:archetype_settings->emergency&client_id=eq.{client_id}
Accept-Profile: control
```
Confirmed via the equivalent SQL (`archetype_settings -> 'emergency'`) against the live test client's row — returns exactly the sub-object for that key (`{"conversion_mode": "A", "freedom_level_override": null}` for the test client), `null` if that client has no settings for that archetype/sub-variant.

### Call `create_client_schema_from_template` via the API (only if ever needed outside MCP-driven onboarding)

The Phase C function lives in `public` and is callable as a PostgREST RPC:
```
POST /rest/v1/rpc/create_client_schema_from_template
Content-Profile: public
Content-Type: application/json

{
  "p_archetype": "emergency",
  "p_specific_tables": ["conversions_emergency"],
  "p_client_schema": "client_{id}_{slug}"
}
```
In practice, Phase C onboarding was built and tested via direct MCP/SQL execution (`SELECT public.create_client_schema_from_template(...)`), not this RPC path — this pattern is documented for completeness in case an n8n-driven onboarding flow is ever built instead of (or alongside) the MCP-driven process. The function is `SECURITY INVOKER` (confirmed in Phase C), so it only works when called by a role with sufficient privilege to create schemas/tables — `service_role` qualifies, `anon`/`authenticated` do not (they'd fail at the first `CREATE SCHEMA` inside the function body, per `Database_Structure_v4_FINAL.md` §8's security-mode note).

### Query `tool_call_log` for stale `WAITING` calls (Action Tool Execution Contract's TIMEOUT handling)

```
GET /rest/v1/tool_call_log?select=call_id,tool_name,state,timestamp&state=eq.waiting&timestamp=lt.{now_minus_N_minutes_iso8601}
Accept-Profile: {client_schema_name}
```
Verified live (against the test client's schema — table is empty since no real traffic has occurred yet, but the query executes cleanly against the live structure). `{now_minus_N_minutes_iso8601}` must be computed by the calling workflow (e.g., an n8n Function/Code node) and substituted in — PostgREST doesn't evaluate relative-time expressions server-side.

**Note:** this query only ever needs to run against **one client schema at a time** (per the `Accept-Profile` targeting requirement) — there's no single query that checks `tool_call_log` across every client at once, since each client's `tool_call_log` is a separate table in a separate schema. A workflow needing a cross-client sweep would need to loop over `control.clients` and run this query once per `client_schema_name` — worth knowing before assuming a single query could do it.

### Suggested-but-not-built helper (flagged per Constraint 1)

While writing the two examples above, a genuine, small gap became visible: **there is no existing view or function that lets a cross-client sweep (like the stale-`WAITING`-calls query) run in one call instead of looping per-schema in the calling workflow.** Postgres has no native cross-schema `UNION` without listing every schema explicitly, and this project's schema-per-client design means schema names aren't known in advance without querying `control.clients` first anyway. A `SECURITY DEFINER` function that dynamically loops over `control.clients.client_schema_name` and unions results (e.g., `control.check_stale_tool_calls(p_minutes int)` returning `client_id, call_id, tool_name, minutes_waiting`) would be a reasonable convenience if this kind of cross-client monitoring turns out to be a frequent n8n need (e.g., a dashboard or alerting workflow). **Not built here** — flagged only, per Constraint 1, since it's a new database object and this task is documentation-only. If built later, it would need the same `SECURITY DEFINER`-in-`public`-is-a-public-API-endpoint caution documented in `Database_Structure_v4_FINAL.md` §8 (keep it in a non-exposed schema like `control`, and it already is not directly reachable from `anon`/`authenticated` there since `control` isn't exposed — but this is a reminder for whoever eventually builds it, not an instruction to build it now).

---

## 4. Manual Exposed-Schemas Procedure (Step-by-Step, Builder-Facing)

```
STATUS: Manual step, required for every new client onboarding.
Automation is planned as an optional, end-of-n8n-build task — not
required for initial client onboarding to work. Do not block onboarding
on automating this.
```

This procedure assumes no prior context on this project's design decisions — only basic Supabase Dashboard familiarity. Confirmed genuinely manual for now: Phase C checked empirically for a `pgrst.db_schemas` GUC on the `authenticator` role (the mechanism some self-hosted PostgREST setups expose via SQL) and found none in this managed Supabase project; this task confirmed again that no available MCP tool manages this setting either. It is a platform-level project setting, not a database-level one.

### 1. Navigate to the schema-exposure setting

- Log into the Supabase Dashboard at `https://supabase.com/dashboard`, select the `zenny-vault` project.
- Go to **Project Settings** (gear icon, bottom of the left sidebar) → **Data API** (under the "API Keys" / "Configuration" section — labeled **Data API** as of the current Dashboard version; if the label has changed, look for "Exposed schemas" or "PostgREST" in Project Settings' search/filter).
- You'll see a field labeled **Exposed schemas**, currently listing `public, graphql_public` — confirmed live while writing this document (this is exactly what the `PGRST106` error in §2 names as the currently-exposed set).

### 2. Add the new schema name to the exposed list

- In the **Exposed schemas** field, add the new client's schema name (e.g., `client_042_acme_bakery`) to the comma-separated list, alongside the existing entries — **do not remove `public` or `graphql_public`** unless there's a specific reason to (removing `public` would break anything still relying on the default schema).
- Save. The Dashboard applies this via Supabase's Management API under the hood (`PATCH /v1/projects/{ref}/postgrest`, updating `db_schema`) — this is also the mechanism to script this step later if/when it's automated (see the STATUS callout above).
- Allow a short propagation delay (typically seconds, not minutes) before testing — PostgREST needs to reload its schema cache after the setting changes.

### 3. Verify the schema is now reachable — a real test call, not "it should work now"

Run the exact same kind of request §2 demonstrated failing, now against the newly-exposed schema:
```
GET /rest/v1/{any_table_in_new_schema}?limit=1
Accept-Profile: {new_schema_name}
apikey: {service_role or anon key}
Authorization: Bearer {matching key}
```
- **Success looks like:** an HTTP `200` (possibly with an empty `[]` if the table has no rows yet, or a `401`/`42501` permission error if using the `anon` key against a table with no grants — either of those confirms the schema itself is now reachable, since you got *past* the schema-resolution step to an actual per-table check). Getting anything other than `PGRST106`'s `406` confirms this step worked.
- **Confirmed failure mode looks like:** the same `406`/`PGRST106` "Invalid schema" response from §2, meaning the schema still isn't registered (or the save in Step 2 didn't take, or the propagation delay hasn't elapsed yet).

### 4. Troubleshooting — if it doesn't appear

- **Still getting `PGRST106` after a minute or more:** re-check the Exposed schemas field actually saved the new entry (navigate away and back to confirm it persisted) — a save that didn't commit is the most common cause.
- **Schema name typo:** the value in Exposed schemas must match the actual Postgres schema name exactly (case-sensitive, no extra whitespace) — cross-check against `control.clients.client_schema_name` for that client, not a hand-typed guess.
- **Getting a `401`/permission error instead of data, even with `service_role`:** that's not a Step 3 problem — the schema is reachable now; check RLS/grants on the specific table instead (Phase C Steps 6/7's verification, or re-run the equivalent checks against this table).
- **Still stuck:** confirm via the Management API directly rather than the Dashboard UI, in case of a UI-specific bug:
  ```bash
  curl -X GET "https://api.supabase.com/v1/projects/{project-ref}/postgrest" \
    -H "Authorization: Bearer {management API access token}"
  ```
  Check the returned `db_schema` field lists the expected schema. If the Management API itself doesn't show it, the Step 2 save genuinely didn't take — retry it.

---

## 5. Rate Limits & Connection Management (n8n-Specific)

### Transaction-mode pooler — the required pattern for n8n

Re-affirming the standing project rule (`Database_Structure_v3.md` §7, Item 5): n8n must use the **Supavisor transaction-mode pooler**, not a direct connection, for any raw-SQL/Postgres-node operations (as opposed to Data API/REST calls, which don't need this at all — the pooler only matters for direct Postgres protocol connections). Verified current against Supabase's live docs while writing this document (2026-07-17) — the pattern hasn't changed:

```
postgres://postgres.{project-ref}:{password}@aws-{region}.pooler.supabase.com:6543/postgres
```

- **Port `6543`** = transaction mode (Supavisor, shared pooler). **Port `5432`** on the same pooler host = session mode — do not confuse the two; using session mode from n8n's short-lived, high-concurrency execution pattern defeats the reason for pooling at all.
- Transaction mode does **not** support prepared statements — if n8n's Postgres node/driver defaults to using them, disable that setting for this connection, per Supabase's current documented caution (a change from earlier assumptions being restated here since it's an easy thing to miss and silently breaks queries).
- Get the exact, live connection string (with the real project-ref and region already filled in) from **Dashboard → Connect button → Transaction pooler** — don't hand-construct it from this pattern with guessed values.

### Connection/request-capacity considerations for a many-schemas, potentially-concurrent design

**Re-verified, not reused from earlier project research** (checked Supabase's current docs directly, 2026-07-17): there is **no fixed "requests per second" throttle** published for the Data API itself under `service_role` — Supabase's documented rate limiting (token-bucket, max 30 request burst capacity per IP) applies specifically to **Auth endpoints** (sign-up, OTP, token refresh, etc.), which this project doesn't use for its data operations at all (n8n bypasses Auth entirely via `service_role`). What actually constrains a many-client, many-simultaneous-conversation system is **connection/pool capacity**, not a request-rate limit:

- Every Compute Add-On (project compute tier) has a fixed **Postgres max connections** figure and a separate, configurable **Supavisor pool size** (adjustable in **Database Settings → Connection pooling**, up to a per-tier cap).
- Supabase's own guidance: if the Data API (PostgREST) is used heavily, keep the pool size under ~40% of the database's max connections; otherwise up to ~80% can be committed to pooling, leaving room for Auth/Storage/other internal connections.
- A separate, tier-specific **"max pooler clients"** limit governs how many *client* connections Supavisor itself will accept concurrently (distinct from the *backend* connections it opens to Postgres, which is the pool-size number above) — this is the number that would actually matter under many-simultaneous-client-conversation load from n8n. **Check this project's current compute tier and its exact max-pooler-clients/max-connections numbers directly in Dashboard → Settings → Compute and Disk before finalizing n8n's concurrency assumptions** — these figures are tier-specific and change if the project's compute tier is ever upgraded, so this document deliberately doesn't hardcode a number that would go stale.
- Practical implication for this design specifically: PostgREST (Data API) connections and any direct-pooler connections both draw from the same underlying capacity. A design with potentially many client schemas receiving simultaneous conversation traffic should monitor **Dashboard → Observability → Database → Database Connections** (breaks down active connections by role: `authenticator` = PostgREST/Data API, `postgres`/custom roles = direct/pooled connections) rather than assume headroom — this is a real, current Dashboard feature, not a hypothetical one.

---

## 6. Cross-References

This document covers the ongoing operational API surface only. It complements, rather than duplicates:

- **`Database_Structure_v4_FINAL.md`** — the actual schema structure (every table, column, enum, index, RLS/grant posture) this API surface sits on top of. Read that first if the question is "what data exists," not "how do I reach it."
- **`Supabase_MCP_Implementation_Notes.md`** — what was learned *building* this database via MCP specifically (tool-behavior gotchas, Postgres `LIKE`-copy pitfalls, the skill-discoverability finding). Historical/implementation-focused, distinct from this document's forward-looking operational focus.
- **`Tool_Naming_Convention.md`** — how n8n *tool/webhook* names should be structured (`{verb}-{entity}` kebab-case) once workflows are built. Separate concern from schema targeting — a tool's name and which schema its underlying query targets are independent decisions.
- **`Client_Onboarding_Guide.md`** — the business-process side of onboarding (archetype identification, module selection, UAT). This document covers only the technical/API side of the same overall process (and specifically, §4 here is the detailed version of that process's Phase C Step 3).
