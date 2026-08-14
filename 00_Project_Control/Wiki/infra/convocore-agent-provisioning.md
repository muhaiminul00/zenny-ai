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

## 3. `control.agent_prompts` — exists, purpose/wiring unconfirmed

Found during the same schema read, not mentioned by either doc above:
`prompt_key, module, archetype, content, version, status,
created_date, promoted_to_stable_date`. Structurally, this looks like
it could be scaffolding for the "Template Dashboard" that
`Convocore_Adapter_Spec_FINAL.md` Part 8.2 says doesn't exist yet (a
system that generates per-client, per-module embedded prompt text).
**Not investigated further this card** — whether it's actually
populated or wired to anything is unknown. Flagged for whoever picks up
BC-060 (manual prompt authoring) to check first, in case it already
half-solves that step.

## Related

- [[../reference/convocore-doc-status]] — which Convocore docs are
  current/primary/superseded.
- `05_Platform_Builds/Convocore/Convocore_Agent_Intake_Checklist_v1.md`
  — the checklist these findings feed into (BC-058).
