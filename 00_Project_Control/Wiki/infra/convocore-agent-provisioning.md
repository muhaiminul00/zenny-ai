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

## Related

- [[../reference/convocore-doc-status]] — which Convocore docs are
  current/primary/superseded.
- `05_Platform_Builds/Convocore/Convocore_Agent_Intake_Checklist_v1.md`
  — the checklist these findings feed into (BC-058).
