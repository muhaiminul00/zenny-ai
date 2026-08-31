# Agent Capability Scope & Business Memory — FLAGGED, not built (2026-08-31)

## What was raised

Human review after BC-2026-08-31-concurrency-hardening raised two related
points, explicitly **not** a build request yet — a standing design
concern to carry into every future archetype Build Card:

1. **Capability breadth**: does an archetype agent (Commerce-Ecom today,
   appointment/consultation next) actually cover the full job — FAQ
   answering, product recommendation in a real sales-person style, and
   whatever else that archetype's job actually requires — or does it
   only cover the narrow tool-calling flows built so far (cart,
   verification, booking)?
2. **Business memory, distinct from chat memory**: the agent needs a
   second memory class alongside per-conversation chat history —
   durable business-level facts (business info, policies, product
   catalog/details, FAQ answers, etc.) that aren't tied to any one
   conversation and must be available to every conversation for that
   client. **Applies to all 6 archetypes, not just commerce-ecom.**

## Why this isn't a Finding-5 bolt-on

This is a different axis from BC-2026-08-31's concurrency fixes (which
were about correctness under concurrent load for behavior that already
existed). This is about whether the *behavior itself* — what the agent
knows and can do — is complete for the archetype's actual job. It's an
architecture-shaped question (where does business memory live, how does
an archetype's tool-calling scope get defined, is business memory
per-client-schema or a shared+overridable pattern like
`agent_prompts`/`email_categories`) that belongs in front of BC-074/075's
build, not bolted onto a card already in flight.

## Status: not decided, not built

No RPC, table, or workflow exists for "business memory" yet. Product
context so far (Convocore's Knowledge Base attempt, then INT-011/012's
Notion+Pinecone pattern for Email Manager specifically — see
[[../platform-quirks/notion-pinecone-kb-pattern]]) is the closest existing
precedent and should be checked first before inventing a new mechanism —
per the Document Resolution Authority's "search broadly first" rule.

**Next step, per CLAUDE.md's Commander→gstack→Execute planning bridge**:
this gets folded into the gstack planning pass for BC-074/075 as a
cross-archetype architectural input, not resolved by Commander directly.
If gstack's plan concludes it's genuinely out of BC-074/075's scope,
that's a legitimate call — the requirement is that it gets *considered*
at the architecture stage (e.g. does the appointment/consultation schema
need a business-memory table now to avoid a migration later), not
silently deferred without a decision.

## See also

- [[../platform-quirks/notion-pinecone-kb-pattern]] — closest existing
  precedent (Email Manager's KB, not agent-wide).
- [[../platform-quirks/n8n-openrouter-direct-llm-pattern]] — the
  per-client-schema-overridable-prompt pattern (`agent_prompts`), a
  possible structural precedent for per-client business memory too.
- `06_Infrastructure/n8n/Workflow_Registry.md`'s "Zenny Own Runtime
  (Phase 14)" section — where BC-074/075 will land once planned.
