# ZENNY — Technical Budget Proposal (v1)

**Purpose:** what the technical stack costs to run build, test, and
production frictionlessly. Two phases: 0 clients, and 0+ clients
(any number of paying clients — production is one mode, not a
per-client special case). Standalone document; live-verified against
Convocore's own pricing/channel-spec tools on 2026-08-24.

---

## 1. The two phases

| Phase | What's running |
|---|---|
| **0 clients** (build/test) | Claude Pro, Hostinger VPS, Convocore (tier — open decision below), Supabase/Notion/Pinecone free |
| **0+ clients** (production) | Same base, all features available; cost scales with what each client actually needs (seat, voice, nothing else) |

---

## 2. Phase 1 — 0 clients (build/test)

| Item | Cost/mo | Notes |
|---|---|---|
| Claude Pro | $20 | |
| Hostinger VPS | $19.49 | `srv1881104`, live-verified via Hostinger MCP |
| Convocore | $0 or $59 | Open decision — see below |
| Supabase / Notion / Pinecone | $0 | Free tier, sufficient at this scale |
| **Total** | **$39.49–$98.49/mo** | |

**Open decision — which Convocore tier for build/test:**

| | **Free** | **Pro ($59/mo)** |
|---|---|---|
| Pros | $0 cost pre-revenue | Tests run on GPT-5.6 Luna, the model we actually ship — trustworthy results, real per-conversation cost data |
| Cons | Free tier can't run Luna at all — findings may not transfer to production | $59/mo burn with no revenue |

**Recommendation:** Pro, but only during active build sprints; step down
to Free between them (credits don't roll over either way, so nothing is
lost by stepping down).

---

## 3. Phase 2 — 0+ clients (production)

**Base plan.** Pick the lowest tier that covers what the roster
actually needs today; upgrade only when a real client requires more —
never speculatively.

| | **Pro ($59/mo)** | **Business ($99/mo)** |
|---|---|---|
| Pros | Covers chat/text on any channel (web, WhatsApp, Messenger, Instagram) | Also unlocks voice — no upgrade needed the moment a voice client signs |
| Cons | No voice — mid-flight upgrade needed if a client needs it | $40/mo extra for a capability no current client needs |

**Recommendation:** Start on Pro. Upgrade to Business the moment a
specific client with a real voice requirement is being onboarded, not
before.

**Per-client variable costs — only pay for what a given client needs:**

| Item | Cost | When it applies |
|---|---|---|
| Client Seat | $15/mo per client | Always — one seat per client company (covers up to 10 of their own users). Reverified live 2026-08-24: current pricing, not a stale figure. |
| Voice — platform fee | ~$0.02/min | Only clients using voice. Requires Business tier. |
| Voice — AI provider | ~$0.05–0.10/min | Only clients using voice (Gemini/Ultravox/etc., billed alongside the platform fee). |
| Voice — Twilio | Client's own account | Zero cost to Zenny — every client brings their own Twilio number/billing. |
| Extra concurrent call line | $5/mo | Only if a client needs more than the default simultaneous call capacity. |
| **Chat channels (WhatsApp, Messenger, Instagram)** | **$0** | **No separate Convocore charge, live-confirmed 2026-08-24** — these are config-only connections; usage draws from the same credit pool as web chat, same per-message rate. |

**Supabase / Notion / Pinecone:** $0 regardless of client count — free
tier is technically sufficient at current scale for all three. Revisit
only if a real backup requirement or KB volume genuinely outgrows it,
not speculatively.

**White Label + watermark removal:**

Neither is available cheaply below a real threshold — live-confirmed
there's no standalone "remove watermark" toggle:

- **White Label plan** ($199/mo) or **Whitelabel add-on** ($200/mo,
  stacks on any base plan) — either one removes Convocore branding from
  the chat widget. No cheaper path exists.
- **Recommendation: not before ~10 paying clients.** Below that, the
  math doesn't justify $199–200/mo extra for branding removal alone.

---

## 4. Example monthly cost

One paying client, chat-only (no voice):

| Item | Cost/mo |
|---|---|
| Claude Pro | $20 |
| Hostinger VPS | $19.49 |
| Convocore Pro | $59 |
| Client Seat | $15 |
| **Total** | **$113.49/mo** |

Each additional chat-only client: **+$15/mo** (seat only — channels are
free, base plan is flat). A client needing voice adds the Business-tier
delta (+$40/mo base, once) plus real per-minute usage once, not per
client, since Business tier is a platform-wide upgrade.

---

## 5. One-time / setup costs

Nothing material — infrastructure is already provisioned:

| Item | One-time cost |
|---|---|
| Domain + DNS | Already owned (sunk) |
| VPS initial setup | Already done (sunk) |
| Twilio phone number (client needing voice, if not using their own) | ~$1 one-time + $3/mo — client's own account, not Zenny's, unless explicitly provisioned by us |

---

## 6. Decisions needed from the team

1. **Build-phase Convocore tier** — Pro (sprint-scoped) or stay on Free
   and accept the model-mismatch risk in testing?
2. **Production base tier** — start on Pro ($59/mo) and upgrade to
   Business only when a real voice-needing client signs, or start on
   Business now for headroom?

Everything else in this doc (client seat cost, channel costs, White
Label threshold, watermark condition) is a confirmed, live-verified
fact — not an open question.
