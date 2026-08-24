# ZENNY — Technical Budget Proposal (v1)

**Purpose:** what the technical stack actually needs to cost — as a
line-item **proposal with options**, not a fixed number — to run build,
test, and production frictionlessly through the 0-client and 1st-client
stages. Supersedes `Zenny_Infra_Cost_Breakdown.docx` for the line items
below (Convocore pricing has restructured entirely since that doc;
n8n's line item in that doc was stale — see Finding 1).

**Not a cost breakdown.** A cost breakdown reports what something
already costs. This is a proposal: real prices, real usage assumptions,
and — everywhere there's a genuine judgment call — two or more options
with pros/cons and our recommendation, for the team to decide.

---

## 0. Findings from cross-checking the old doc (read this first)

1. **The old doc's "$20/mo n8n" line is stale/wrong.** n8n is
   self-hosted on our own Hostinger VPS (`srv1881104`), not a paid n8n
   Cloud subscription — confirmed against `Wiki/infra/vps-and-docker.md`.
   It costs nothing beyond the VPS itself. Removed as a standalone line.
2. **Convocore's pricing model changed structurally, not just in
   numbers.** Old doc: free until 1st client, then flat $20/mo + $15/mo
   per client seat. Current live model (pulled from Convocore's own
   pricing tool, last reviewed 2026-08-14): tiered subscriptions
   (Free/Starter $29/**Pro $59**/Business $99/White Label $199/White
   Label Elite $349), each unlocking a different model tier + monthly
   credit allowance, **plus** separate add-ons on top (Client Seat $15,
   Workspace Seat $10, Concurrent Call Line $5, Twilio number $3, and a
   $200/mo "Whitelabel" add-on — not the same thing as the $199/mo
   "White Label" *plan*, confusingly). See Section 2.
3. **GPT-5.6 Luna is our documented default model** for new Convocore
   agents (per the Convocore MCP's own build instructions) and it only
   unlocks on **Pro tier ($59/mo) or above.** Free tier cannot run the
   model we actually ship. This is the single biggest cost driver this
   proposal has to resolve — see Option Set A below.
4. **The old doc's "Supabase Pro" assumption for the 1st client needs a
   fresh reason, not the old one.** `Wiki/infra/supabase-tier-limits.md`
   confirms the *original* reason Pro was flagged (a branded custom
   domain for OAuth Edge Functions) was solved for free via a VPS-side
   Traefik proxy — Supabase itself is **still on the free tier today**.
   If we want Pro for the 1st real client, it needs a real current
   justification (Section 3 lays out the one that's still live: backups).
5. **Notion + Pinecone are real, live dependencies** (Email Manager's KB
   pipeline) that weren't on the original list. Checked both — see
   Section 4. Good news: neither needs a paid tier at this stage.
6. **Twilio costs Zenny nothing.** Confirmed via
   `Wiki/credentials/twilio.md`: every client brings their own Twilio
   account/number — Zenny never holds a Twilio bill. Not a line item in
   this budget, ever, by design.

---

## 1. The two phases (matching your framing)

| Phase | What's running |
|---|---|
| **0 clients** (build/test) | Claude Pro, Hostinger VPS (n8n + dashboard + auth proxy), Convocore (tier TBD — Option Set A), Supabase free tier, Notion free, Pinecone free |
| **1st client** (production) | Same, + Convocore client seat + AI usage, Supabase (tier TBD — Section 3) |

---

## 2. Convocore — the real decision point

### 2.1 Live plan tiers (Convocore's own pricing reference, reviewed 2026-08-14 — verify against convocore.ai/pricing before finalizing, prices are stated to change)

| Plan | Price/mo | Credits/mo | Unlocks |
|---|---|---|---|
| Free | $0 | 500 (one-time) | Tier 4 value models only — no Luna |
| Starter | $29 | 5,000 | Tier 3+ |
| **Pro** | **$59** | 15,000 | **Tier 2+, including GPT-5.6 Luna** |
| Business | $99 | 25,000 | Tier 1 flagship + **voice/phone unlock** |
| White Label | $199 | 60,000 | All tiers + Convocore branding removed |
| White Label Elite | $349 | 120,000 | All tiers, high volume |

### 2.2 Relevant add-ons

| Add-on | Price | What it does |
|---|---|---|
| Client Seat | $15/mo | One client company account (up to 10 client-side users) |
| Workspace Seat | $10/mo | Extra internal team seat |
| Concurrent Call Line | $5/mo | Extra simultaneous voice call capacity |
| Twilio Phone Number | $3/mo | Extra number (only relevant once voice ships) |
| "Whitelabel" add-on | $200/mo | Removes branding, **+5 client seats**, +1 phone number, +2 workspace seats, stacks on top of any base plan |

**Don't confuse** the $200/mo Whitelabel *add-on* with the $199/mo White
Label *plan* — they're separate products with near-identical names.

### 2.3 Option Set A — 0-client (build/test) phase

| | **A1 — Free tier** | **A2 — Pro tier ($59/mo)** |
|---|---|---|
| Pros | $0 cost while pre-revenue | Tests run on the actual model we ship (Luna) — build/test results are trustworthy; 15,000 credits/mo is far more than internal testing will use; gives a real read on per-conversation AI cost before quoting any client |
| Cons | Every test runs on a different model tier than production ever will — bugs, tone, and cost estimates found during "testing" may not transfer to the real Luna behavior at all | $59/mo burn with zero revenue behind it |

**Our recommendation:** **A2, but scoped to active build sprints only.**
Subscribe to Pro only while actively building/testing a Convocore
Canvas agent (e.g. this month's Carmelli build); downgrade to Free
between sprints. Unused monthly credits don't roll over regardless, so
there's no loss in stepping down when idle — this avoids paying $59/mo
for months where no active Convocore work is happening, while still
testing against the real model whenever real build work is underway.

### 2.4 Option Set B — 1st client (production) phase

| | **B1 — Pro + 1 seat = $74/mo** | **B2 — Business + 1 seat = $114/mo** |
|---|---|---|
| Pros | Matches Carmelli's actual scope (chat-only, click-and-collect, no voice) — no unused capability | Unlocks voice/phone now, no re-upgrade needed the moment a voice-needing client (e.g. an `emergency`-archetype client) signs |
| Cons | Voice-needing clients would require a mid-flight upgrade | Paying $40/mo extra for a capability zero current roster clients use — Twilio itself is schema-only/never-seeded platform-wide (`Wiki/credentials/twilio.md`) |

**Our recommendation:** **B1.** Every real and test client on the
roster today is chat-only; voice is a documented-but-unbuilt capability
platform-wide. Upgrade to Business the moment a specific client with a
real voice requirement is being onboarded, not speculatively.

### 2.5 White Label — explicitly out of scope for this budget's horizon

Both the $199/mo plan and $200/mo add-on remain **not recommended before
~10+ paying clients**, matching the old doc's own guidance — nothing
about the pricing restructure changes that math at 0–1 clients.

---

## 3. Supabase — needs a real reason, not the old one

The free tier is fully adequate technically for the 1st client's scale
(no bandwidth/compute pressure observed; the original Pro driver —
branded OAuth domain — is already solved via the VPS proxy at $0
Supabase cost). The one legitimate reason left to consider Pro now:

| | **C1 — Stay on free tier** | **C2 — Upgrade to Pro (~$25/mo)** |
|---|---|---|
| Pros | $0 cost, technically sufficient at 1-client scale | Daily backups / point-in-time recovery for real, paying-client data (leads, orders, appointments) — free tier has no backup guarantee |
| Cons | A real client's data has no managed backup if something goes wrong at the DB layer | $25/mo for a client base still small enough that a manual `pg_dump` cadence could cover the same risk more cheaply |

**Our recommendation:** **C1 for the 1st client specifically**, paired
with a manual periodic `pg_dump` export as a stopgap backup (near-zero
cost, some human effort). Revisit C2 once real client data volume or
count makes a manual backup cadence impractical to keep up with —
likely by the 3rd–5th real client, not the 1st. Flagging this as a
genuine reversal of the original assumption, not a silent drop.

---

## 4. Notion + Pinecone (Email Manager's KB pipeline)

Checked both against real current usage
(`Wiki/platform-quirks/notion-pinecone-kb-pattern.md`) and each
provider's live pricing page.

**Notion** — Free plan includes full Public API access (our
`zenny-notion-api` integration is a plain API-token integration, not one
of the "premium connections" — GitHub/Asana-style native connectors —
that require Business plan). **No paid tier needed now.** Upgrade
trigger: only if the team wants heavy human collaboration inside the
Notion workspace itself (seat-based Plus/Business), not driven by KB
volume or the integration.

**Pinecone** — Starter/free tier: 2GB storage, 2M write units/mo, 1M
read units/mo, up to 5 indexes. Real current usage: one serverless
index, a handful of KB pages per client, daily re-sync (SCH-004) for
clients with a KB source. This is nowhere near free-tier limits at 1–2
clients. **No paid tier needed now.** Upgrade trigger: first real sign
that monthly write/read units approach the free-tier caps (roughly
tracks total KB page count × client count × sync frequency) — likely a
double-digit-client concern, not a 1st-client one. First upgrade step if
needed is Builder ($20/mo flat), not Standard.

---

## 5. Full monthly budget by phase

### 5.1 Zero clients (build/test)

| Item | Cost/mo | Notes |
|---|---|---|
| Claude Pro | $20 | Human's own subscription |
| Hostinger VPS | $19.49 | `srv1881104` (KVM 1), live-verified via Hostinger MCP subscription `AzZLVKVRPDrqtJm0`, auto-renewing monthly — covers n8n + dashboard + auth proxy, no separate n8n cost. (A second KVM 1 subscription exists on the account, $19.49/mo, but belongs to VM `1729215` — confirmed out-of-scope, not Zenny's — excluded here.) |
| Convocore | $0 or $59 | Per Option Set A — recommend Pro only during active build sprints |
| Supabase | $0 | Free tier |
| Notion | $0 | Free tier |
| Pinecone | $0 | Free tier |
| **Total** | **$39.49–$98.49/mo** | Range reflects whether a Convocore build sprint is active that month |

### 5.2 1st client (production)

| Item | Cost/mo | Notes |
|---|---|---|
| Claude Pro | $20 | |
| Hostinger VPS | $19.49 | Same VPS (`srv1881104`), no per-client VPS cost — confirmed ample headroom (`Wiki/infra/vps-and-docker.md`) |
| Convocore Pro + 1 Client Seat | $74 | Per recommendation B1 |
| Supabase | $0 | Per recommendation C1, + manual backup cadence |
| Notion | $0 | |
| Pinecone | $0 | |
| **Total** | **$113.49/mo** | |

**Per-additional-client cost beyond the 1st:** +$15/mo (Convocore Client
Seat only) — everything else is genuinely flat until a real capacity or
feature trigger fires (voice, KB volume, Supabase backups). This
matches the old doc's "~$15/client" finding; it still holds, it's just
layered on a materially different, higher base ($113.49 vs. the old
$65 — Convocore's real Pro-tier requirement plus the live-verified VPS
rate are why).

---

## 6. One-time / setup costs

Almost nothing here — the infrastructure is already provisioned and
paid for from earlier build phases:

| Item | One-time cost | Status |
|---|---|---|
| Domain (zeromanuals.com) + DNS | Already owned | Sunk — Netlify-managed, no action needed |
| VPS initial setup | Already done | Sunk |
| Dedicated Twilio phone number (once voice ships) | ~$1 one-time + $3/mo | Not needed until a voice-enabled client signs; client's own Twilio account bears this, not Zenny |

No other one-time technical costs are anticipated for the 0-to-1-client
horizon this proposal covers.

---

## 7. Decisions needed from the team

1. **Convocore build-phase tier** — approve A2 (Pro, sprint-scoped) or
   stay on A1 (Free) and accept the model-mismatch risk in testing?
2. **Convocore 1st-client tier** — approve B1 (Pro, $74/mo) or B2
   (Business, $114/mo, pre-emptive voice readiness)?
3. **Supabase for 1st client** — approve C1 (free tier + manual backup)
   or C2 (Pro, $25/mo, managed backups from day one)?
4. ~~Confirm current Hostinger VPS renewal rate~~ **CLOSED —
   live-verified in Execute mode via Hostinger MCP.** `srv1881104`'s
   real subscription (`AzZLVKVRPDrqtJm0`, KVM 1) renews at
   **$19.49/month**, auto-renewing, next billing 2026-09-05. Confirmed
   by matching subscription IDs to VM IDs directly — a second identical
   KVM 1 subscription on the account belongs to the wiki-documented
   out-of-scope VPS (`1729215`), correctly excluded from this budget.
   All figures in Sections 5.1/5.2 above now use the real rate, not a
   placeholder range.
