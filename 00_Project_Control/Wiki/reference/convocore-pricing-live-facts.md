# Convocore Pricing — Live-Verified Facts

**Status:** current as of 2026-08-25. Original pass verified via the
Convocore MCP's `get_pricing_info` and `get_channel_integration_spec`
tools (static knowledge tools, not billing calls); a same-day
correction pass then cross-checked against a real screenshot of our
own workspace's live Billing → Plans screen; a second correction pass
the next day (2026-08-25) got a direct answer from Convocore's own
support AI, which is the highest-authority source in this whole chain
and **fully resolves the Client Seat question below** — see that
section. Source of truth for
`01_Strategy/Marketing/Zenny_Technical_Budget_Proposal_v1.md`.

## Client Seat add-on — CORRECTED AGAIN: does not exist as a standalone Pro/Business add-on at all

**Superseded by the 2026-08-25 finding below.** The $15/mo figure
itself is real (it's White Label's per-seat rate beyond the included
20), but the original framing here — "current pricing, choose whichever
plan you want and add $15/client" — was wrong. It does not stack onto
Pro or Business as a standalone purchase. See "Client Seat / multi-
client management — RESOLVED" below for the real mechanism.

## Channels (WhatsApp / Messenger / Instagram) — no separate Convocore charge

Checked `get_channel_integration_spec` (all sections) and
`get_pricing_info`'s `addOns` list: **none of WhatsApp, Messenger, or
Instagram carry a per-channel subscription fee.** They're config objects
(`waNumbers/{phoneId}`, `metaPages/{pageId}`) attached to a workspace's
existing plan — connecting a channel costs nothing extra. Usage on any
of these channels draws from the same monthly credit pool at the same
per-message rate as the web widget (~1.1–1.6 credits/message with the
recommended models, per `rulesOfThumb.chat`). **The only channel-related
paid line items are voice-specific:** Twilio Phone Number ($3/mo
add-on, only needed if not using the client's own Twilio number) and
Concurrent Call Line ($5/mo, only needed for extra simultaneous voice
capacity). SMS uses its own `twilio_numbers/{sid}` records — same
no-extra-Convocore-fee pattern, separate from WhatsApp.

## Chat widget watermark/branding — CORRECTED: removed starting at Business tier, not White Label

**The MCP's static `get_pricing_info` add-on description was wrong on
this point** — it implied branding removal only happens via the White
Label plan or Whitelabel add-on. A same-day screenshot of our own
account's live Billing → Plans feature-comparison table shows "Remove
ConvoCore branding" as ✅ starting at **Business ($99/mo)**, not just
White Label ($199/mo) — Free/Starter/Pro all show it as unavailable,
Business/White Label/White Label Elite all include it. The live
account screenshot is the higher-authority source here; the MCP's
static description is the one that was stale/wrong, not the earlier
$15 seat or channel findings.

Practical effect: upgrading to Business for voice also removes the
watermark in the same purchase — they're not two separate cost
decisions anymore.

## AI-agent count cap per tier (from the same 2026-08-24 screenshot; superseded in relevance by the White Label finding below)

Each plan caps the total number of Convocore agents a workspace can
run: Free 2, Starter 3, Pro 10, Business 20, White Label/Elite
unlimited. **Note: this cap is no longer the operative constraint for
Zenny's production tier decision** — the 2026-08-25 finding below
establishes that Pro/Business can't run Zenny's multi-client model at
all regardless of agent count, since they're single-organization
accounts. This cap only matters if Zenny ever ran a single-org,
single-brand deployment (not the actual model).

## Twilio number / concurrent call line bundling on Business

Business ($99/mo) includes **2 Twilio phone numbers and 3 concurrent
call lines free** — the $3/mo (extra number) and $5/mo (extra call
line) add-ons only apply beyond those bundled amounts. White Label
includes 3 numbers/10 lines; Elite includes 5 numbers/25 lines.

## Voice provider cost — corrected to real per-provider figures

The account's own "Voice minutes calculator" gives real all-in rates
(platform fee + provider), not the rough $0.05–0.10/min range used
earlier: **Gemini Live ≈ $0.03/min all-in** (cheapest), up to
**Ultravox/Grok Live ≈ $0.09/min all-in**. Telephony via Twilio through
Convocore's own credit system: $0.015/min + $0.02/min platform =
$0.035/min total.

## Client Seat / multi-client management — RESOLVED 2026-08-25

The MCP live-check (agency_read 403, below) couldn't fully close this
on 2026-08-24, so the human asked Convocore's own support AI directly.
Direct quote, verbatim:

> "While we don't have a standard '$15/mo client seat add-on' for the
> Pro plan in our current self-serve pricing... Our native multi-client
> management system — which allows you to create separate organizations
> for each client, manage their individual billing, and control their
> access from a single dashboard — is a feature exclusive to our White
> Label and White Label Elite plans. On the Pro plan, the account is
> designed for a single organization. If you need to manage multiple
> clients professionally under your own brand, the White Label plans
> are the intended path."

**Definitive answer: there is no standalone $15/mo Client Seat add-on
purchasable on Pro or Business.** Managing more than one client
business under one Convocore account — separate org, separate billing,
one dashboard — requires **White Label ($199/mo) or White Label Elite
($349/mo)**, full stop. The earlier "Business gets read-only Agency API
access" clue from the MCP check was a red herring for this specific
question — read access to the agency endpoint isn't the same as being
able to purchase multi-client management. This is why the earlier
"Business is the more likely real floor" guess undersold it: **White
Label, not Business, is the real floor.**

**Consequence for Zenny specifically:** since Zenny's whole model is
one platform account serving many separate client businesses, **White
Label is required starting with the first paying client**, not an
upgrade to reach at ~10 clients or on a per-feature trigger. This is
now reflected as the production base plan in
`Zenny_Technical_Budget_Proposal_v1.md`.

**Still not confirmed, flagged for a call with Moe Ayman (Convocore's
founder — offered directly by their own support AI):**
- Whether the $15/mo Client Seat add-on rate applies to sub-accounts
  purchased beyond White Label's 20 included, or a different mechanism
  is used.
- Whether a lower-cost entry path exists for a small (1–3 client)
  starting agency, or $199/mo list price is the real floor regardless
  of scale.

## MCP live-check, 2026-08-24 (superseded by the direct answer above, kept for the record)

Attempted to resolve via MCP before the direct answer existed: no
billing/add-on-catalog tool exists in this toolset, and our own
workspace is currently on the **Free tier** — below Pro — so even a
read-only check of agency/client-account endpoints (`agency_read`)
403s: `"API access requires the Business plan or higher (read-only).
White Label unlocks full API write access."` Same underlying blocker as
`convocore-doc-status.md`'s existing 403 finding. This check was
inconclusive on its own (see correction above) — the real answer came
from asking Convocore's support AI directly the next day, not from any
further MCP attempt.

## Related, already-documented finding (not new, cross-referenced)

[reference/convocore-doc-status.md](convocore-doc-status.md) already
records that Convocore's REST + MCP agent-creation API returns `403
"API access requires the Business plan or higher"` (re-checked
2026-08-14, still active) — an account-level gate on programmatic
agent building, separate from the model-tier gate above. Doesn't change
this budget's numbers (manual Canvas UI remains the accepted build
path regardless of plan), but worth knowing if API/MCP-based agent
creation is ever wanted: that specifically needs Business ($99/mo) or
higher, independent of which model tier is needed for chat testing.

## Source

- Original pass: Convocore MCP `get_pricing_info` (section: all) and
  `get_channel_integration_spec` (section: all), pulled live 2026-08-24.
- Correction pass, same day: human-provided screenshot of our own
  workspace's live Billing → Plans screen (feature-comparison table +
  voice-minutes calculator), plus a live `agency_read` MCP call
  confirming the existing 403 blocker and surfacing the Business
  read-only / White Label write-access distinction.

See `Wiki/log.md` entries for that session (both the initial pass and
the same-day correction).
