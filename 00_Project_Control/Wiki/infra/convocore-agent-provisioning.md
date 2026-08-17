# Convocore Agent Provisioning — Live Schema State (BC-058)

Two real doc/reality gaps found and resolved while building
`Convocore_Agent_Intake_Checklist_v1.md` (BC-058, 2026-08-14). Both
verified via live Supabase reads, not assumed.

## 1. Agent naming convention — resolved, doc was stale

`Convocore_Findings_Required_Updates_FINAL.md` §1.2/§6.2 still lists
this as "no naming convention exists yet" / an open item (#2 in its
own Open Items table). It's actually already decided: per
`Planning_to_Build_Transition_v1.md` §2.5, the confirmed convention is
`{ClientBusinessName} Assistant` (e.g. "Bright Smiles Dental
Assistant") — client's own brand on the widget, never "Zenny" or
"ZeroManual" client-facing. Resolved by a different, later document per
the Document Resolution Authority rule — Findings doc's "still open"
flag is stale, not corrected there (out of scope for this card), noted
here and in the checklist (A7) instead.

## 2. `control.convocore_agent_map` — already built, not "pending"

`Convocore_Adapter_Spec_FINAL.md` Part 2.3 says the schema shape for
mapping `client_id` → Convocore agent is "not yet finalized ... flags
this as a builder decision, not resolved here," listing the minimum
required fields. Live schema read (2026-08-14) confirms the table
already exists with exactly those fields:

```
control.convocore_agent_map (
  id                       uuid, pk, default gen_random_uuid()
  client_id                uuid, not null
  convocore_agent_id       text, not null
  convocore_agent_secret_id uuid, not null   -- Vault reference, never plaintext
  convocore_region         text, not null    -- 'eu' / 'na'
  agent_display_name       text, not null
  created_at               timestamptz, default now()
)
```

Matches the Adapter Spec's stated minimum exactly. The Adapter Spec's
"pending" framing is stale — not corrected in that doc this card (out
of scope), disclosed here instead.

## 3. `control.agent_prompts` — Email Manager's, not Convocore's; built but not wired (corrected BC-058c)

**Correction:** this table is unrelated to Convocore's Template
Dashboard gap — human confirmed (2026-08-14) it was built for **Email
Manager's** LLM-prompt nodes (INT-010 categorization, INT-011 drafting).
The intent: move those prompts from hardcoded-in-n8n to per-client-
overridable, starting with one default prompt.

**Live-verified (BC-058c):** that move hasn't happened yet. Read both
workflows' full node graphs directly —

- **INT-010** (`Zenny Email Manager - CategorizeEmail`, id
  `pk4YXHCwI3fNixb7`) — the "Build Classification Prompt" Code node
  hardcodes the category `DEFINITIONS` object and the full prompt text
  inline in JS.
- **INT-011** (`Zenny Email Manager - DraftEmail`, id
  `fmBjtfi7vqdszs78`) — the "Build Draft Prompt" Code node hardcodes
  the entire draft-generation prompt template inline in JS.

Neither workflow queries or references `control.agent_prompts`
anywhere. A broader `search_workflows` pass for "agent_prompts" also
returned zero matches across the instance. **Confirmed: the table is
built but genuinely unused today** — not a Convocore artifact, not
wired into anything yet, a real pending Email Manager improvement
(swap the two hardcoded prompt-building Code nodes to read from
`agent_prompts`, falling back to a default row when no client-specific
override exists). Not built this card — out of scope, flagged as a
real candidate for a future Build Card. See
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

**BC-062 UPDATE (2026-08-14/15) — build started, then correctly
paused for a real architecture question, not self-resolved:** both
workflows have draft (unpublished) wiring to a new
`public.get_agent_prompt` RPC reading `control.agent_prompts`, with 2
seed rows live.

**Finding 1, resolved — the credential-attach failure was NOT a
Supabase permission block.** Human's hypothesis (BC-052's anon-grant
REVOKEs blocking this) was checked and is wrong: attaching a credential
to an n8n node is a purely n8n-internal action (a reference into n8n's
own credential store), unrelated to what that credential can later do
against Supabase's REST API. The real cause: `update_workflow`'s
`addNode` operation silently drops an inline `credentials` value —
confirmed by re-testing with the dedicated `setNodeCredential`
operation instead, which applied cleanly with no skip-note (both nodes
now have `zenny-vault-suparbase`, id `guCWYmcVycnfMixw`, attached in
draft — inferred correct by naming/chronology, not yet live-execution-
confirmed since credential assignments are redacted from every read
path available). Both workflows are still unpublished — no live
behavior changed by this fix.

**Finding 2, resolved — the control-schema, archetype-keyed design
BC-062 built was the wrong shape.** Human's stated mental model
(`control` = cross-client shared plane; each client gets its own
schema cloned from a `tpl_{archetype}` template, tracked via
`control.clients.client_schema_name`) is confirmed correct, live, and
consistently applied — schema list matches the roster exactly, and
`Database_Structure_v4_FINAL.md` §1 documents it directly. That same
doc **already flags `control.agent_prompts` with `← never synced to
any client schema`** — a known, disclosed gap in the original design,
not a doc/reality conflict.

The live database has a direct, working precedent for exactly this
shape of data: `email_categories`. It exists in **both** `control`
(16 rows) **and** every `tpl_*` template (0 rows, structure only) and
every `client_test_*` schema (16 real rows each) — and the only thing
that's actually queried at runtime (`list_client_email_categories`,
`EXECUTE format('... FROM %I.email_categories', p_schema)`) is the
**per-client-schema copy**. `control.email_categories` is a real,
harmless orphan — pre-dates BC-045 (2026-08-12), which correctly
migrated this exact kind of per-client-overridable content to the
per-schema pattern and never dropped the old control copy.

**Conclusion, BUILT (2026-08-15):** `agent_prompts` now follows the
same pattern as `email_categories` — added to `public` reference
scaffolding + all 5 `tpl_*` templates + backfilled into the 5 real
client schemas (2 seed rows each, copied verbatim from `control.
agent_prompts`), queried via a new per-schema RPC
(`public.get_client_agent_prompt(p_schema, p_prompt_key)`, same shape
as `list_client_email_categories`). `create_archetype_template` and
`create_client_schema_from_template` both updated (`agent_prompts`
added to their `v_common_tables` arrays) so future template/client
creation includes it automatically, same as `email_categories`.
`control.agent_prompts` kept in place as the master-defaults seed
source (not dropped); the old control-schema/archetype-keyed RPC
(`get_agent_prompt`) was genuinely dead after the rewire (never
referenced by any published workflow) and was dropped.

**INT-010 and INT-011 rewired and live-verified end to end** — both
now call `get_client_agent_prompt` with the client's real resolved
schema name (already available via UTIL-001 earlier in each workflow),
not a hardcoded/archetype value. Tested via `test_workflow` with real
(unpinned) LLM calls: INT-010 correctly classified a test email as
"Support" with the exact expected prompt text (byte-identical
substitution verified directly from execution data); INT-011 correctly
generated a grounded draft reply using the fallback-context path. Both
published, live.

Full detail: `Wiki/log.md` session-BC-062 redesign entry (2026-08-15),
`Wiki/platform-quirks/n8n-openrouter-direct-llm-pattern.md`.

## 4. BC-060 (2026-08-17) — first real client provisioned, real findings on `create_client_schema_from_template`

Ran the completed intake checklist for real against Carmelli Bakery —
Zenny's first non-test `control.clients` row
(`eb27a21f-209d-4b6d-8f6e-cb216411f6c4`, `client_carmelli_bakery`
schema). Full step-by-step process (the actual point of this card):
`05_Platform_Builds/Convocore/BC-060_Onboarding_Process_Reference_v1.md`.

**Two real bugs/gaps in `create_client_schema_from_template` found live,
not previously documented:**
- `p_archetype` must be the **template schema suffix**
  (`commerce`/`emergency`/`appointment`/`consultation`/`engagement`),
  not the `archetype_enum` value — `tpl_commerce` is one shared
  template covering both `commerce_ecom` and `commerce_restaurant`.
  Passing `commerce_ecom` raises "source template schema
  tpl_commerce_ecom does not exist."
- The function assumes every table in `p_specific_tables` has a
  `conversion_id` column and force-adds a `<table>_conversion_id_fkey`
  constraint for each. `waitlist_entries` doesn't (`customer_id`/
  `lead_id` instead) — including it throws a clean, fully-rolled-back
  DDL error. Correct `p_specific_tables` for a commerce-archetype
  client: `['conversions_ecom', 'conversions_restaurant', 'orders']`
  only; `waitlist_entries` isn't auto-added by anything and needs its
  own handling if a future client actually needs it (this demo doesn't,
  `waitlist_enabled = false`).

**Confirmed (not previously stated this explicitly):** the clone is
structure-only — `agent_prompts`/`email_categories` land empty and must
be seeded from their real master sources (`control.agent_prompts WHERE
module='email_manager'`, `control.email_categories WHERE client_id IS
NULL`) every time a new client is provisioned, same as BC-062's
backfill pattern. This isn't automatic anywhere yet — a real candidate
for `create_client_schema_from_template` itself to absorb once a second
real client makes the pattern worth generalizing.

**Stopped at 3 real gates** (dashboard-login Auth account, Convocore
Canvas UI build — still `403` on REST/MCP, re-verified live this
session — and a real Gmail OAuth connection) — see the process
reference doc for exact resume steps on each.

## Related

- [[../reference/convocore-doc-status]] — which Convocore docs are
  current/primary/superseded.
- `05_Platform_Builds/Convocore/Convocore_Agent_Intake_Checklist_v1.md`
  — the checklist these findings feed into (BC-058).
- `05_Platform_Builds/Convocore/BC-060_Onboarding_Process_Reference_v1.md`
  — the lived step-by-step provisioning process (BC-060).
