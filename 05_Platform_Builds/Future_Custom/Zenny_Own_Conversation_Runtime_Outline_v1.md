# Zenny Own Conversation Runtime — Full Product Outline (v1)

```
Status:     Outline / roadmap only — not a Build Card, not v1-mandatory.
            Captures the full end-state so step-by-step building has a
            real target instead of scope invented per session.
Trigger:    Convocore's pricing at the API-access tier we need went up
            enough to make replacing it worth real evaluation (2026-08-17
            advisor-mode discussion).
Priority:   Agent output quality first, simplicity second. Runtime
            choice (n8n-native vs. a dedicated LangGraph/FastAPI
            service) is decided by evidence from a prototype, not
            assumed either way — see §0.
Supersedes: Nothing — complements `Zenny_SaaS_Architecture_Plan_v2.1.md`
            (kept as reference for its schema/phasing discipline; its
            runtime choice, a separate LangGraph+FastAPI service, is
            NOT adopted by default here — see §0 for why and when it
            would be reconsidered).
```

---

## 0. The one real open decision: n8n-native vs. dedicated agent runtime

**Default path: n8n-native.** n8n's AI Agent node is itself LangChain-based
— staying in n8n is not a quality downgrade, it's removing a second
system (and the integration seam between "brain" and "executor" that
system would require: a new webhook contract, HMAC signing, its own
timeout/retry rules, its own observability stack). Every extra hop
between deciding what to do and doing it is a place state can drift, a
timeout to mistune, a new failure mode — a reliability cost, not a
free architectural upgrade.

**The router problem is real, and here's the actual fix** (not a naive
"skip re-routing when nothing changed" — n8n has no persistent
execution position, every inbound message is a fresh execution, so
*something* runs at the top of every single message, unavoidably):

- **Dispatch (runs every message): a DB lookup, not an LLM call.**
  Session state (Postgres, same row as chat memory) stores
  `active_agent`. A `Switch` node reads it and routes straight to the
  matching specialized sub-workflow. This is the n8n-native
  approximation of "resume at this node" — a stored pointer instead of
  a framework-level one.
- **Routing decision (real judgment, but piggybacked, not a second LLM
  call): the currently-active specialized agent self-reports a
  `handoff` field** as part of its normal structured response (the
  reply it's generating anyway), instead of a dedicated classifier
  running every turn. A true classification call only happens once per
  conversation — turn 1, when there's no `active_agent` yet.
- **Net steady-state cost: 1 DB read + 1 LLM call per turn** — the
  multi-agent structure adds ~zero LLM overhead over a single-agent
  design would cost anyway.

**The decision is reversible by construction, not just an assumption:**
the specialized-agent layer is isolated behind the same tool-calling
contract every module already uses (RPCs, n8n sub-workflows). If
BC-070's prototype shows n8n's AI Agent node genuinely can't hit the
output-quality bar on real test conversations (see gate below), only
the "brain" — the router + specialized-agent nodes — gets swapped for
a dedicated runtime. The database, the tools, the dashboard, and the
channel adapters do not change. This is why the decision doesn't need
to be made perfectly up front.

**Quality gate before committing further** (part of BC-070's own
Definition of Done, not a separate card): a fixed set of real test
conversations per archetype (tool-call accuracy, multi-turn context
retention, correct escalation/handoff behavior, latency) run against
the n8n-native prototype. Pass → continue n8n-native for the full
build. Genuine, evidenced failure on a specific dimension → swap only
the brain layer, keep everything else.

---

## 1. Backend — conversation/agent layer

- **Router + session state + specialized sub-workflow agents** — design
  finalized this session (§0). Specialized agents map to real,
  distinct jobs: product recommendation, lead conversation, booking,
  support, escalation — narrower than today's 5 platform modules, this
  is the finer-grained layer *inside* what Growth Agent/Conversion
  Engine currently do as monoliths.
- **Per-client config-driven behavior** — extends the already-proven
  `agent_prompts` (BC-062) + `client_active_modules` pattern. No new
  schema shape, more rows/keys.
- **Tool-calling** — reuse Conversion Engine's 11 Tools + existing
  RPCs as-is. Already built, already live-tested.
- **Channel adapters** — Web first (matches every real client's actual
  ask so far, including Carmelli's B2 answer). WhatsApp/Instagram/
  Telegram next, same shape as existing OAuth `client_connections`
  categories, new `category` values. Voice last and hardest — Twilio's
  schema already exists, unused (`Wiki/credentials/twilio.md`).
- **Per-client database isolation** — already built, nothing new
  needed (`control` + per-client schema + RLS, BC-052/064).

## 2. Customer-facing dashboard

Mapped against what already exists (Phase 5, `PROJECT_STATE.md`) so
nothing gets rebuilt by accident:

| # | Tab | Status | Note |
|---|---|---|---|
| 1 | Integrations | **Exists** (BC-052/063) | Extend: add channel OAuth (WhatsApp Business, Instagram, Telegram) alongside existing calendar/email/ecommerce categories — same table, new `category` values, not a new mechanism. |
| 2 | Chat history (by date, thread view) | **New** | Reads from the new conversation/message tables §1 introduces. Straightforward once §1 exists — this is a read-only view over data the runtime already has to persist for memory anyway. |
| 3 | Appointments / Orders / Inventory | **Appointments, Orders exist** (Phase 5B/5C). **Inventory: not started** (Phase 5A/SCH-007) | Inventory tab is naturally sequenced *after* the queued BC-065-069 catalog-sync cards — no real inventory data to show until those exist. |
| 4 | Agent settings | **New** | UI over tables that already exist (`agent_prompts`, `client_active_modules`, `client_config`) — this is a UI-only build, no new backend shape. |
| 5 | Revenue / agent performance metrics | **New** | Needs aggregation views over `conversions` (already tracked per client schema) + dashboard charts. Backend-light, frontend-heavy. |
| 6 | Email Manager — approve/edit/delete drafts | **Pattern exists, this specific application doesn't** | BC-053's verification/approval queue (`pending_verifications`, opt-in, `/approvals` page) is the proven mechanism — extending it to INT-011's drafts specifically is new wiring, not a new pattern. |

## 3. Admin-facing dashboard (full cross-client access)

This is Phase 5D (Onboarding dashboard) plus general admin tooling —
**already deliberately deferred** until after Path B's first real
build (BC-060/061) completes, per existing human decision (build the
manual written from a lived build, not guessed in advance). This
outline doesn't change that sequencing — it gives Phase 5D a fuller
target to build toward once its turn comes, instead of a narrower
"just onboarding" scope.

## 4. Sequencing (per explicit instruction: not all v1, step by step)

Recommended order, respecting real dependencies rather than the list
order above:

1. **BC-070** — router + specialized-agent core, web channel only.
   Validates the brain-layer decision (§0's quality gate) before
   anything else depends on it.
2. **Wire BC-070 to one real client end-to-end** (Carmelli) — replaces
   the manual Convocore Canvas build entirely once proven, closing
   BC-060's gate 2 for real instead of working around it.
3. **New dashboard tabs that don't depend on anything else**: chat
   history, agent settings, revenue metrics. Pure additions once §1
   exists.
4. **BC-065-069** (already queued, `PROJECT_STATE.md` Path A #6) —
   unlocks a real Inventory tab.
5. **Phase 5D / admin dashboard** — built from what steps 1-4 actually
   needed, per existing sequencing decision.
6. **Multi-channel expansion** (WhatsApp/Instagram/Telegram) — only
   once the web channel is proven solid on a real client, not before.
7. **Voice** — last, hardest, genuinely separate effort (Twilio
   pipeline, real-time speech) — no client has asked for it yet.

---

## Document Changelog
- **v1 (2026-08-17)** — first outline, synthesized from an advisor-mode
  discussion (Convocore pricing pressure → Zapier ruled out → n8n-native
  design worked out in detail, including the router/dispatch
  correction). Not yet turned into individual Build Cards beyond the
  already-queued BC-070/BC-065-069.
