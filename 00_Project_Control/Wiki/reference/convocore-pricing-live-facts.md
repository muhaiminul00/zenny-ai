# Convocore Pricing — Live-Verified Facts

**Status:** current as of 2026-08-24, verified via the Convocore MCP's
`get_pricing_info` and `get_channel_integration_spec` tools (static
knowledge tools, not billing calls). Source of truth for
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

## Chat widget watermark/branding — only removed at White Label tier

No standalone "remove watermark" toggle exists below White Label.
Branding removal is bundled into exactly two purchase paths:
- **White Label plan** ($199/mo) — includes branding removal.
- **Whitelabel add-on** ($200/mo, stacks on any base plan — Free through
  Business) — also includes branding removal, plus 5 free client seats,
  1 free phone number, 2 free workspace seats.

Free/Starter/Pro/Business all show Convocore's own branding on the
widget with no cheaper removal option. This means the existing
"White Label not before ~10 paying clients" guidance also gates
watermark removal — there is no independent, cheaper way to drop it
sooner.

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

Convocore MCP `get_pricing_info` (section: all) and
`get_channel_integration_spec` (section: all), pulled live 2026-08-24
during the Technical Budget Proposal correction pass. See
`Wiki/log.md` entry for that session.
