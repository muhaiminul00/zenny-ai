# Convocore Pricing — Live-Verified Facts

**Status:** current as of 2026-08-24. Original pass verified via the
Convocore MCP's `get_pricing_info` and `get_channel_integration_spec`
tools (static knowledge tools, not billing calls); a same-day
correction pass then cross-checked against a real screenshot of our
own workspace's live Billing → Plans screen, which is more
authoritative than the MCP's static knowledge blob where the two
disagree — see the watermark correction below. Source of truth for
`01_Strategy/Marketing/Zenny_Technical_Budget_Proposal_v1.md`.

## Client Seat add-on — $15/mo is current, not a stale pricing-page bug

Re-pulled fresh on 2026-08-24 and matches the 2026-08-14 figure exactly:
**$15/month per client seat** (one client company account, up to 10 of
that client's own users included). Two independent pulls a week+ apart
returning the identical number is enough confidence to treat this as
real current pricing, not a one-off page glitch. No reason found to
choose a different plan/pricing path because of this figure.

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

## AI-agent count cap per tier (new finding, from the same screenshot)

Each plan caps the total number of Convocore agents a workspace can
run, independent of any voice/branding consideration: Free 2, Starter
3, **Pro 10**, **Business 20**, White Label/Elite unlimited. If one
Zenny client maps to one agent, this is a real ceiling on how many
clients a given base plan can serve — Pro tops out at 10 clients,
Business at 20, before White Label becomes necessary purely on agent
count, separate from the ~10-paying-client White Label guidance
elsewhere.

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

## Client Seat / sub-account gating — checked via MCP, still genuinely unresolved

The same screenshot's feature table shows **"Client sub-accounts" as
unavailable (—) on both Pro and Business**, only appearing from White
Label (20 included) up — casting real doubt on whether the $15/mo
Client Seat add-on is purchasable below White Label at all. Attempted
to resolve via MCP: no billing/add-on-catalog tool exists in this
toolset, and our own workspace is currently on the **Free tier** —
below Pro — so even a read-only check of agency/client-account
endpoints (`agency_read`) 403s: `"API access requires the Business plan
or higher (read-only). White Label unlocks full API write access."`
Same underlying blocker as `convocore-doc-status.md`'s existing
403 finding, re-confirmed live 2026-08-24. One clarifying detail did
surface: **Business gets read-only Agency API access, White Label gets
full write** — suggesting Business, not Pro, is the more likely real
floor for any client-seat/sub-account capability, but this doesn't
confirm purchasability either way. Genuinely open — resolving it for
real needs either a temporary Business-tier upgrade to test the
purchase UI directly, or a direct question to Convocore support.

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
