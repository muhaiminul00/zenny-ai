# ZENNY — Technical Budget Proposal (v1)

**Purpose:** what the technical stack costs to run build, test, and
production frictionlessly. Two phases: 0 clients, and 0+ clients (any
number of paying clients).

**Pricing references (for the team's own review):**
- Public pricing page: https://convocore.ai/pricing
- Convocore's in-app Billing → Plans screen (our own workspace's real entitlements)

**⭐ Before finalizing any plan choice below: book a call with Moe
Ayman, Convocore's founder.** Convocore's own support AI directly
offered this when asked about our multi-client scaling needs — worth
taking them up on it, especially since White Label is now a real
$199+/mo commitment from client 1, not a someday upgrade.

---

## 1. The two phases

| Phase | What's running |
|---|---|
| **0 clients** (build/test) | Claude Pro, Hostinger VPS, Convocore (tier — open decision below), Supabase/Notion/Pinecone free |
| **0+ clients** (production) | Same base + **Convocore White Label, required from the first paying client** (see Section 3 — this is the single biggest change from earlier drafts) |

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

**Our recommendation:** Pro, but only during active build sprints; step down to Free between them. This build-phase question is unaffected by the White Label finding below — testing one agent under one workspace doesn't need multi-client management yet.

---

## 3. Phase 2 — 0+ clients (production)

### Resolved: White Label is required from the first paying client, not an eventual upgrade

Directly confirmed by Convocore's own support AI (asked specifically
about the $15/mo Client Seat add-on):

> "While we don't have a standard '$15/mo client seat add-on' for the
> Pro plan in our current self-serve pricing... Our native multi-client
> management system — which allows you to create separate organizations
> for each client, manage their individual billing, and control their
> access from a single dashboard — is a feature exclusive to our White
> Label and White Label Elite plans. On the Pro plan, the account is
> designed for a single organization. If you need to manage multiple
> clients professionally under your own brand, the White Label plans
> are the intended path."

This overturns the earlier draft's assumption (a $15/mo seat stacking
on Pro or Business). **There is no per-client add-on path below White
Label** — managing more than one client business under one Convocore
account requires White Label ($199/mo) or White Label Elite ($349/mo),
starting with client #1, not at some later client-count threshold.

### Base plan for production

| | **White Label ($199/mo)** |
|---|---|
| Multi-client management | ✅ Separate org + billing per client, one dashboard |
| Watermark | ✅ Removed |
| Voice | ✅ Included (3 Twilio numbers + 10 concurrent call lines bundled) |
| AI agents | Unlimited |
| Client sub-accounts included | 20 (Client Seat add-on likely covers extra beyond this — **confirm with Moe**, not independently verified) |
| Credits/mo | 60,000 |

Business ($99/mo) and Pro ($59/mo) are **not viable production base
plans** for Zenny's actual model (one Convocore account serving many
separate client businesses) — they cap out at a single organization
regardless of price, per Convocore's own confirmation above. Business
and Pro's individual features (voice, watermark removal, agent counts)
are moot once White Label is the floor, since White Label already
includes all of them.

**Our recommendation:** budget for White Label ($199/mo) starting with
client #1. Talk to Moe before committing — Convocore's own AI flagged
this as a "specific scaling needs" conversation worth having, and there
may be a custom/negotiated arrangement worth knowing about before
locking in list price.

**Still to confirm on that call, not resolved by this doc:**
- Does the $15/mo Client Seat add-on apply on top of White Label's 20
  included sub-accounts, or is a different mechanism used past 20?
- Is there a lower entry cost for a genuinely small (1–3 client) agency
  just starting out, or is $199/mo list price the real floor regardless
  of scale?

**Supabase / Notion / Pinecone:** see Section 5 — free tier holds for a real range of production usage, not unconditionally forever.

---

## 4. Example monthly cost

One paying client, White Label required for multi-client management:

| Item | Cost/mo |
|---|---|
| Claude Pro | $20 |
| Hostinger VPS | $19.49 |
| Convocore White Label | $199 |
| **Total** | **$238.49/mo** |

Up to 20 clients: no further Convocore cost increase (sub-accounts
included). Beyond 20, or beyond bundled voice capacity (3 numbers/10
call lines), extra costs apply per the add-on rates in Convocore's
pricing table — worth re-confirming with Moe once the roster
approaches that range, since exact behavior above the included quota
isn't independently verified here.

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
real usage data shows a metric above genuinely approaching its cap.

---

## 6. One-time / setup costs

| Item | One-time cost |
|---|---|
| Domain + DNS | Already owned (sunk) |
| VPS initial setup | Already done (sunk) |
| Twilio phone number (only if Zenny provisions it, not the client) | ~$1 one-time + ongoing usage — covered by White Label's bundled numbers/lines up to the included quota |

---

## 7. Decisions needed

1. **Build-phase Convocore tier** — Free or Pro ($59/mo, sprint-scoped)?
2. **Call with Moe** — book before finalizing; confirm the two open questions in Section 3 (Client Seat mechanics past 20 sub-accounts, and whether a lower-cost entry path exists for a small starting agency).
3. **Production base plan** — resolved: White Label ($199/mo), required from client #1. Not an open option anymore, pending only the confirmations above.
