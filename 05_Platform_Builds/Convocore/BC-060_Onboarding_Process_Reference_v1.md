# BC-060 — Onboarding Process Reference (v1)

```
Status:   Run for real, 2026-08-17, against Carmelli Bakery — Zenny's
          first non-test client record. STOPPED partway through, at a
          real Credential Gate / manual-build boundary (3 items, see
          "Where this stops" below) — not a failure, the expected shape
          of this process until an onboarding dashboard exists.
Purpose:  A tested, lived reference for what "provision a real client
          from a completed intake checklist" actually requires — steps,
          order, dependencies, and exactly where a human must act. This
          is the seed for the future onboarding dashboard + workflow
          (Phase 5D, deliberately built after this, per human decision
          2026-08-14) — not a plan, a record of what really happened.
Input:    `Convocore_Agent_Intake_Checklist_v1.md`, fully answered
          (BC-059 AUTO rows + BC-060 human ASK answers).
```

---

## Step 0 — Live-verify before assuming anything

Before touching any data, re-checked 2 things the intake checklist's
own design depends on, both already flagged elsewhere but re-verified
live rather than trusted from memory (Mandatory MCP Verification):

- **Convocore REST/MCP reachability**: called `list_agents` — still
  `403 FORBIDDEN — API access requires the Business plan or higher`,
  identical to the 2026-08-04/08-14 findings (`Wiki/reference/
  convocore-doc-status.md`). Not cleared. Manual Canvas UI build is
  still the only path (BC-057b's agreed fallback).
- **`control.clients` naming/shape convention**: queried all 5 existing
  rows — every one is a `TEST CLIENT` fixture. Carmelli is the first
  real (demo) client ever provisioned; no existing real-client naming
  precedent to follow for `client_schema_name`, so `client_carmelli_bakery`
  was chosen directly (business-name-derived, no `client_test_NNN_`
  prefix — that prefix is a test-fixture convention, not a general one).

## Step 1 — `control.clients` (the root record)

One row. Field-by-field mapping from the checklist:

| Checklist field | Column | Value | Why |
|---|---|---|---|
| A1 | `business_name` | `Carmelli Bakery` | — |
| A4 | `archetype` | `commerce_ecom` | — |
| C2 | `billing_tier` | `demo` | New value — no existing client had used a demo tier before; `test`/`standard` were the only precedents and neither fit (not a disposable test fixture, not a paying client). |
| C3 | `status` | `onboarding` | Matches AUTO convention — every client starts here regardless of demo/live. |
| B8 | `active_hours_start_utc`/`active_hours_end_utc` | `0`/`24` | The column comments document `0/24 = always-on` — matches B8's "message 24/7" answer directly, no translation needed. |
| — | `client_schema_name` | `client_carmelli_bakery` | See Step 0. |
| — | `template_version`, `template_archetype_at_onboarding` | `1`, `commerce_ecom` | Standard for a first provisioning. |

**Real output:** `client_id = eb27a21f-209d-4b6d-8f6e-cb216411f6c4`.

## Step 2 — Clone the client schema

Called `public.create_client_schema_from_template('commerce', p_specific_tables, 'client_carmelli_bakery')`.

**Real finding, not assumed:** `p_archetype` is **not** the `archetype_enum`
value (`commerce_ecom`) — the template schema is literally named
`tpl_commerce` (one shared template covers both Commerce-Ecom and
Commerce-Restaurant sub-types), confirmed by querying `pg_namespace`
directly rather than guessing from the enum name. Passing `commerce_ecom`
would have raised "source template schema tpl_commerce_ecom does not
exist."

**Real finding #2:** the function auto-generates a `<table>_conversion_id_fkey`
constraint for every table listed in `p_specific_tables`, assuming each
has a `conversion_id` column. `waitlist_entries` doesn't (it has
`customer_id`/`lead_id` instead) — including it in `p_specific_tables`
throws `column "conversion_id" referenced in foreign key constraint
does not exist` and rolls back the whole DDL transaction cleanly (no
partial schema left behind — confirmed via `pg_namespace` before retry).
Correct `p_specific_tables` for a commerce-archetype client:
`['conversions_ecom', 'conversions_restaurant', 'orders']` —
`waitlist_entries` and `appointments` are handled separately by the
function itself (appointments auto-detected; waitlist_entries not
auto-added at all — this demo client has no `waitlist_entries` table,
which is fine, `waitlist_enabled = false` in `client_config` anyway).

## Step 3 — `control.client_config`

One row, mapped from B6/B7/B8/B9/C5/C6:

| Checklist field | Column | Value |
|---|---|---|
| B7 | `language_mode`/`language_list` | `fixed` / `['en']` |
| C5 | `default_country_code` | `GB` |
| B8 | `send_window_start`/`send_window_end` | `00:00:00`/`23:59:59` (24/7, matches Step 1's hour columns) |
| B9/D5 | `email_address` | `carmelli.zennyai@gmail.com` |
| B3/B4 | `voice_agent_enabled`/`sms_agent_enabled` | `false`/`false` |
| C6 | `cart_value_escalation_threshold`, `waitlist_enabled` | `NULL`, `false` |
| B5 | `archetype_settings` | `{}` (standard default, no customization requested) |

## Step 4 — `control.client_active_modules`

One row per B1 selection, plus `core_agent` (always-on, not itself a
checklist question but every other client's real usage implies it's
expected present): `core_agent`, `growth_agent`, `conversion_engine`,
`recovery_engine`, `email_manager` — all `enabled = true`. `NULL`/absent
= not selected, per B1's un-checked options (no voice/SMS-only modules
to add here — B1 doesn't have module rows for those, they're channel
flags on `client_config` instead, Step 3).

## Step 5 — Seed per-client tables the clone doesn't seed

**Real finding:** `create_client_schema_from_template` clones **table
structure only** (`LIKE ... INCLUDING ALL`), not `tpl_commerce`'s data —
and `tpl_commerce` itself has 0 rows in `agent_prompts`/`email_categories`
by design (template schemas are structure-only, per BC-062). Confirmed
by counting rows immediately after Step 2: both 0. Seeded from the real
master sources, exactly BC-062's established backfill pattern:

- `agent_prompts` (2 rows: `classify_email`, `draft_email`) — copied
  from `control.agent_prompts WHERE module = 'email_manager'`.
- `email_categories` (16 rows) — copied from
  `control.email_categories WHERE client_id IS NULL` (the master
  default set every other real/test client's categories also trace
  back to).

Both live-verified via `count(*)` after — 2 and 16 respectively.

## Step 6 — Knowledge base (B12)

B12's answer: "website has links to those pages, we'll use a separate
static doc/sheet for now" — no live product-catalog sync exists yet
(that's the queued BC-065-069 work). Built a real Notion page (not a
placeholder) under the existing `Zenny Client Knowledge Bases` parent,
`KB — client_carmelli_bakery`, populated from BC-059's already-fetched
live site content (products, kosher certs, ordering policy) with the
genuine open gaps (hours, refund policy, ecommerce platform) stated
honestly rather than guessed — matches this doc's own "Open gaps"
section in the checklist. Then inserted the real
`control.client_kb_source` row pointing at it (`notion_page_id =
3bf8bbfd-f843-811e-867f-f3da2992678a`) — this is what INT-011/INT-012
will actually read from, once a Gmail connection exists to trigger
Email Manager at all (see Step 8).

## Step 7 — What was deliberately NOT invented

Per the Credential Gate (never invent a credential — extended here to
never invent a login/auth identity either, same class of risk): no
`auth.users` row was created directly via SQL for
`carmelli.zennyai@gmail.com`, even though the service-role SQL
connection technically has permission to insert one. `Wiki/platform-
quirks/supabase-auth-quirks.md` already documents GoTrue's exact
NULL-vs-empty-string field expectations on direct `auth.users` writes
as a known trap, and a hand-built row still wouldn't be a real,
usable login (no real password, no invite flow) — it would be
indistinguishable from inventing a credential. **Real human step
required**, not worked around.

## Where this stopped — 3 real, disclosed gates

**1. Dashboard login (C4). CLOSED 2026-08-17.** Human created the real
Supabase Auth account directly (Authentication → Users → Add User,
`carmelli.zennyai@gmail.com`) — `auth.users.id
4473a9b8-0536-4795-8147-745f0a8c1196`, confirmed live
(`email_confirmed_at` set). Resumed with the `dashboard_provision_user`
RPC (BC-051) rather than a raw insert:
```sql
SELECT public.dashboard_provision_user(
  '4473a9b8-0536-4795-8147-745f0a8c1196'::uuid,
  'eb27a21f-209d-4b6d-8f6e-cb216411f6c4'::uuid,
  'client_user'
);
```
**Live-verified**, not assumed: simulated the real auth session
(`SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims =
'{"sub":"4473a9b8-...","role":"authenticated"}'`, inside a rolled-back
transaction — no session state left behind) and called
`dashboard_get_my_client()` — returned the correct
`{client_id, business_name: "Carmelli Bakery", client_schema_name:
"client_carmelli_bakery", archetype: "commerce_ecom"}`. This user can
now genuinely log into the dashboard and see only Carmelli's data.

**2. The Convocore agent itself.** REST/MCP both still `403`
(Step 0) — genuinely can't be built by any tool call this session has
access to. **Human action:** manual build in the Convocore Canvas UI
(BC-057b's agreed fallback), named `Carmelli Bakery Assistant` (A7),
using B1's module list (Growth Agent + Conversion Engine + Recovery
Engine + Email Manager, on top of always-on Core Agent) with each
node's Instructions authored from `Agent_Runtime_System_v1.md`'s
matching per-module sections (per the checklist's own "what this
checklist does NOT cover" note — prompt text is authored at build
time, not a checklist answer). Once built, its real `convocore_agent_id`
+ region need a `control.convocore_agent_map` row — cannot be
inserted with an invented ID.

**Gate 2's actual copy-paste-ready content (2026-08-17, BC-071):** the
Variables/Tools/Global-Prompt+Nodes sequencing above is now filled in
for real — `BC-071_Carmelli_Build_Package/` (3 docs) gives the human
exact Keys, Descriptions, and Instructions to paste into the Canvas UI,
Doc-Search-First-sourced from `Agent_Runtime_System_v1.md`,
`INTEGRATION_CONTRACT_v1.md`, and `n8n_Workflow_Specification_v1.md`.
Two real findings surfaced there: Carmelli's real conversion mode is B
(Guided to Product Link), not A (no cart-creation API exists — D2), and
only 3 of the 5 active modules need a Convocore node at all (Recovery
Engine and Email Manager are both entirely n8n-side, never chat-
triggered). This does not close gate 2 — the human still has to
actually build it in the Canvas UI — it removes the "what do I even
type into each field" gap.

**3. Email inbox connection.** `carmelli.zennyai@gmail.com` has no
Gmail OAuth credential anywhere yet (`control.client_connections` has
no row for this client) — SCH-003's hourly INT-009 fan-out will simply
find nothing to process for Carmelli until one exists, and INT-011's
drafting/INT-012's KB sync are similarly inert for this client without
it. **Human action:** once the dashboard login (gate 1) exists, connect
Gmail through the dashboard's real Integrations → Connect flow (the
same OAuth path every other client uses) — or, for a faster demo-only
path, connect it directly in n8n's own credential UI against a Google
OAuth2 credential scoped to `carmelli.zennyai@gmail.com`.

None of these three can be worked around without inventing a real
external identity or account — exactly the class of action the
Credential Gate exists to stop. Everything upstream of them (Steps 1-6)
is real, live-verified, and already sitting in the database — nothing
here needed to be redone once gate 1 cleared.

**Gates 2 and 3 remain open.** Gate 2 (Convocore agent) stays manual —
human decision, staying on the free tier rather than upgrading to
unblock the API. Gate 3 (Gmail connection) is now genuinely reachable
for the first time — the human can log in as Carmelli and use the
dashboard's real Integrations → Connect flow, no n8n-side workaround
needed (a n8n-credential shortcut was suggested and correctly rejected
by the human — that path is for Zenny's own internal service accounts,
not client-facing connections; the dashboard OAuth flow is the only
correct path for a client's own inbox).

---

## Document Changelog
- **v1 (2026-08-17)** — first real run, against Carmelli Bakery. Steps
  1-6 complete and live-verified. Stopped at 3 gates.
- **v1.1 (2026-08-17)** — gate 1 (dashboard login) closed same day,
  live-verified via a simulated real session. Gates 2/3 still open, see
  above.
- **v1.2 (2026-08-17)** — gate 2's real content package built (BC-071):
  `BC-071_Carmelli_Build_Package/` (Variables/Tools/Global Prompt+Nodes,
  3 docs). Gate 2 itself still open — the human still does the manual
  Canvas UI build; this only supplies the sourced content.
