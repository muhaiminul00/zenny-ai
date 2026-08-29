# Decision: Zenny's Own Conversation Runtime (Convocore Replacement)

**Status:** DECIDED, architecture locked — 2026-08-29. Build not yet started.

## What was decided

Zenny replaces Convocore with its own conversation runtime, built against
`Zenny_MultiNode_Runtime_Architecture_v1.0.md` (router + specialized nodes,
n8n-native) and `Zenny_Channel_Adapter_Architecture_v2.0.md` (OpenBSP-based
multi-tenant WhatsApp/Instagram/web-chat gateway). Both docs live in
`05_Platform_Builds/Zenny_SaaS/`. Full decision record, including the review
process and every correction made along the way, is in
`docs/designs/zenny-saas-runtime-pivot.md` — this page is the durable summary,
not a duplicate of that full record.

## Why (context that changed the plan mid-session)

- **Convocore service is fully stopped.** Zenny paused it and committed to
  its own infrastructure — not a future option, an already-made call.
- **Real demand signal exists:** a Meta ad run generated 7-8 leads/day;
  nobody converted, and the stated reason was price. This is the actual
  evidence behind the cost-reduction thesis, not a hypothesis.
- **Channel parity is required at launch, not fast-follow.** The unconverted
  leads were quoted a Convocore build with web chat + WhatsApp + Instagram
  together — losing that parity risks suppressing conversion independent of
  the price fix.
- **Carmelli Bakery is NOT part of this build's validation.** She has a
  separate, unrelated December delivery. The runtime is validated internally
  (test suite, not live traffic) until launch, when the existing lead
  pipeline gets re-engaged at the new price.
- **Timeline:** founder's target is 1-1.5 months to full production; the
  architecture docs' own estimate for the full scope (2-3 archetype node
  types + 3-channel gateway) is 2.5-3 months. Both numbers are on record —
  the plan does not pretend the shorter one is confirmed.

## What's still open (not yet decided)

- **Which 2-3 specific archetypes** (of the 6: emergency, commerce-ecom,
  commerce-restaurant, appointment, consultation, engagement) the lead
  pipeline actually needs — confirmed "mixed," not yet named. This blocks
  finalizing Phase 1's real node list.
- OpenBSP's live project health — re-verify before the channel gateway build
  starts, not assumed stable from the doc alone.
- Meta App Review lead time — unquantified.
- Whether the Convocore subscription itself is cancelled or just unused.

## Review trail

Went through gstack's `/office-hours` → `/plan-ceo-review` (HOLD SCOPE) →
`/plan-eng-review` (2 architecture fixes: shared entry sub-workflow for
tenant isolation, LLM timeout/degradation) → an independent Codex outside-voice
pass (20 findings, resolved or accepted-as-tracked-risk) → a post-review
correction pass once the Convocore-stopped/Carmelli-decoupled/real-demand
facts surfaced. Full trail with every AskUserQuestion decision:
`docs/designs/zenny-saas-runtime-pivot.md`.

## Cross-references

- [[../reference/gstack-skill-playbook]] — gstack workflow context
- [[../reference/convocore-pricing-live-facts]] — the pricing facts that
  originally motivated this, now superseded by the full-stop decision above
