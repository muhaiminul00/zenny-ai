# ZENNY — Technical Budget Proposal (v1)

**Purpose:** what the technical stack costs to run build, test, and
production frictionlessly. Two phases: 0 clients, and 0+ clients (any
number of paying clients — production is one mode, not a per-client
special case).

**Pricing references (for the team's own review):**
- Public pricing page: https://convocore.ai/pricing
- Convocore's in-app Billing → Plans screen (our own workspace's real
  entitlements — the source used to correct this doc's numbers)

---

## 1. The two phases

| Phase | What's running |
|---|---|
| **0 clients** (build/test) | Claude Pro, Hostinger VPS, Convocore (tier — open decision below), Supabase/Notion/Pinecone free |
| **0+ clients** (production) | Same base, all features available; cost scales with what each client actually needs (seat, voice, agent count) |

---

## 2. Phase 1 — 0 clients (build/test)

| Item | Cost/mo | Notes |
|---|---|---|
| Claude Pro | $20 | |
| Hostinger VPS | $19.49 | `srv1881104` |
| Convocore | $0 or $59 | Open decision — see below |
| Supabase / Notion / Pinecone | $0 | Free tier — see Section 5 |
| **Total** | **$39.49–$98.49/mo** | |

**Open decision — which Convocore tier for build/test:**

| | **Free** | **Pro ($59/mo)** |
|---|---|---|
| Pros | $0 cost pre-revenue | Tests run on GPT-5.6 Luna, the model we actually ship — trustworthy results, real per-conversation cost data |
| Cons | Free tier can't run Luna at all — findings may not transfer to production. Also a hard **500-credit cap that's one-time, not monthly** — a real build/test sprint can burn through it mid-way and stop testing dead until it's gone. | $59/mo burn with no revenue |

**Our recommendation:** Pro, but only during active build sprints; step down to Free between them (credits don't roll over either way).

---

## 3. Phase 2 — 0+ clients (production)

**Base plan.** Pick the lowest tier that covers what the roster actually needs today; upgrade only when a real client requires more.

| | **Pro ($59/mo)** | **Business ($99/mo)** |
|---|---|---|
| Chat channels | Web, Telegram, WhatsApp, Instagram, Messenger, Discord, Email — full set | Same, plus voice/phone |
| Voice | ❌ Not available | ✅ Included — 2 Twilio numbers + 3 concurrent call lines bundled free |
| **Watermark removal** | ❌ **Cannot remove** — Convocore branding stays on the widget | ✅ **Removed** — Business is the actual removal threshold, not White Label |
| AI agents included | 10 | 20 |
| Cons | No voice, watermark stays | $40/mo extra if voice/branding removal genuinely isn't needed yet |

**Our recommendation:** Start on Pro. Upgrade to Business the moment either (a) a client needs voice, (b) you want the watermark gone, or (c) the roster is approaching 10 agents on Pro — whichever comes first. Note (b) means Business is worth more than it looked before: it buys voice *and* branding removal in the same upgrade, not two separate purchases.

**Agent-count ceiling (new finding, not previously in this doc):** each base plan caps total AI agents, independent of voice/branding needs — Free 2, Starter 3, **Pro 10**, **Business 20**, White Label/Elite unlimited. If one client = one agent, Pro tops out at 10 clients and Business at 20 regardless of any other consideration; White Label becomes the real trigger once the roster approaches that count, not just the ~10-paying-client rule of thumb below.

**Per-client variable costs — only pay for what a given client needs:**

| Item | Cost | When it applies |
|---|---|---|
| Client Seat | $15/mo per client (see flag below) | Always, per client company |
| Voice — platform + provider (all-in) | ~$0.03/min (Gemini Live) to ~$0.09/min (Ultravox/Grok) | Only clients using voice |
| Voice — Twilio number | $0 to Zenny if client's own account; if Zenny provisions it: included free (first 2 numbers on Business), then $3/mo each beyond that | Only if a client needs a number and doesn't bring their own |
| Extra concurrent call line | Included free (first 3 on Business), then $5/mo each beyond that | Only past the bundled 3 |
| **Chat channels (WhatsApp, Messenger, Instagram, Telegram, Discord, Email)** | **$0** | Included in Pro+ — no per-channel fee, usage draws from the same credit pool as web chat |

**⚠ Open flag — checked, still genuinely unresolved:**
The feature-comparison table shows **"Client sub-accounts" as unavailable
(—) on both Pro and Business**, only appearing starting at White Label
(20 included) and Elite (unlimited) — casting doubt on whether the
$15/mo Client Seat add-on can be purchased/used below White Label at
all. There's no billing/add-on-catalog API to check this directly, and
our own account is currently on Free tier — below Pro — so even a
read-only check of agency/client-account endpoints 403s with "API
access requires the Business plan or higher." One clarifying data
point did surface from that error: **Business gets read-only Agency API
access, White Label gets full write access** — suggesting Business,
not Pro, is the more likely real floor for any client-seat/sub-account
capability, though this doesn't confirm purchasability either way.
**Recommend either a real Business-tier upgrade to test the purchase UI
directly, or asking Convocore support**, before treating the $15/client
figure as certain at Pro or Business.

**Supabase / Notion / Pinecone:** see Section 5 — free tier holds for a real range of production usage, not unconditionally forever.

---

## 4. Example monthly cost

One paying client, chat-only (no voice), client's own Twilio, Client Seat pricing assumed to hold on Pro (see flag above):

| Item | Cost/mo |
|---|---|
| Claude Pro | $20 |
| Hostinger VPS | $19.49 |
| Convocore Pro | $59 |
| Client Seat | $15 |
| **Total** | **$113.49/mo** |

Each additional chat-only client: **+$15/mo** (seat only, if the seat flag above resolves in Pro's favor) — up to 10 total agents before Pro itself becomes the ceiling. A client needing voice, or a decision to remove the watermark, moves the whole account to Business (+$40/mo base, once, platform-wide), which also raises the agent ceiling to 20 and bundles 2 numbers + 3 call lines.

---

## 5. Supabase / Notion / Pinecone at production scale

Free tier is what's running today, sufficient at current (near-zero real
client) volume. Whether it holds through real production depends on
actual usage against each provider's published free-tier caps —
not yet load-tested against real client traffic, so treat the following
as trigger points to watch, not a guarantee:

| Service | Free-tier cap (published) | Watch for |
|---|---|---|
| Supabase | ~500MB database, ~1GB file storage, ~5GB bandwidth/mo | DB size or monthly bandwidth approaching the cap as real client data (leads, orders, conversations) accumulates — likely a mid-double-digit-client concern, not a 1st-client one |
| Notion | Free workspace, API rate-limited (~3 req/sec) | Only relevant if KB sync volume or team collaboration inside Notion itself grows heavy — not driven by client count directly |
| Pinecone | ~2GB storage, ~2M write units/mo, ~1M read units/mo, up to 5 indexes | Write/read units approaching the cap as KB pages × clients × sync frequency grows — first upgrade step if needed is Builder ($20/mo flat) |

**Recommendation:** stay on free tier for all three now; revisit only when
real usage data shows a metric above genuinely approaching its cap, not
on a client-count schedule alone.

---

## 6. One-time / setup costs

| Item | One-time cost |
|---|---|
| Domain + DNS | Already owned (sunk) |
| VPS initial setup | Already done (sunk) |
| Twilio phone number (only if Zenny provisions it, not the client) | ~$1 one-time + ongoing per Section 3's Voice — Twilio row |

---

## 7. Decisions needed

All options, pros/cons, and our recommendation are laid out above for each — final call is the team's:

1. **Build-phase Convocore tier** — Free or Pro ($59/mo, sprint-scoped)?
2. **Production base tier** — Pro ($59/mo) or Business ($99/mo — now also the watermark-removal tier, not just the voice tier)?
3. **Client Seat verification** — checked via MCP; still genuinely unresolved (no billing/add-on API exists, our account's Free tier blocks even a read-only check). Needs either a real Business-tier upgrade to test the purchase UI, or a direct question to Convocore support, before the $15/client figure is trusted at Pro/Business (see flag in Section 3).
