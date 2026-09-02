# Test-Fixture Clients — Real Connected Providers (BC-076-Card2a)

## What this page is for

Two existing test/demo clients already carry real, working provider
connections between them, covering every provider Card 3's ingestion
legs need to build against. Recorded here so a future session never
needs to re-query the database to find out which account has what.

## The two accounts

**`test-dashboard-bc015@zenny.internal`** — client_id
`baa673b5-c51a-4a7b-91f5-a37027f8dca4` ("TEST CLIENT -- BC-015 ORDER
DASHBOARD TEST -- DO NOT USE", `commerce_ecom`):
- Google Calendar — connected (`quaantummedia.zeromanual@gmail.com`)
- Gmail — connected (same Google account)
- WooCommerce — connected (`https://zenny-woocom.free.je`)

**`carmelli.zennyai@gmail.com`** — client_id
`eb27a21f-209d-4b6d-8f6e-cb216411f6c4` ("Carmelli Bakery", the real
demo business, `commerce_ecom`):
- Calendly — connected (`quaantummedia.zeromanual@gmail.com`)
- Shopify — connected (`ember-and-co-ozearycd.myshopify.com`)

Between the two, every provider Card 3 needs (Calendar, Gmail,
WooCommerce, Calendly, Shopify) already has a real, live connection —
no new test client needs provisioning for Card 3 to start.

## Resilience to a dashboard "Disconnect" click — read before assuming anything needs backing up

**Google and Calendly disconnects are REAL, provider-side revokes**
(`connection-lifecycle`'s `revoke` action hits `oauth2.googleapis.com/
revoke` and `auth.calendly.com/oauth/revoke` for real — see
[[../infra/connection-lifecycle-actions]]). Once revoked, the refresh
token is genuinely dead at the provider — nothing can be "stored" ahead
of time to survive this; the only recovery is a human redoing the OAuth
consent flow. Treat these two connections as fragile — avoid clicking
Disconnect on them unless you mean it.

**Shopify and WooCommerce disconnects are LOCAL-ONLY** (no
app-initiated revoke API exists for either — `connection-lifecycle`
honestly discloses `provider_revoked: false` and flips local `status` to
`revoked`, but never calls out to the provider at all). This means the
underlying Vault-stored credential is untouched by a dashboard
disconnect — it is **already resilient** without needing a separate
backup. If one of these ever shows `status: 'revoked'` but you know the
key/secret wasn't actually rotated on the provider's side, an Execute
session can safely flip `control.client_connections.status` back to
`'connected'` directly — no new OAuth flow needed, the same token still
works.

**Net: nothing needs duplicating.** For Google/Calendly, no amount of
storage helps past a real revoke — the human explicitly asked for this
to be captured "so you don't need to check which account has that," and
this page is that answer, not a secret-copying mechanism (which would
either be impossible for these two, or redundant for Shopify/
WooCommerce, whose real credential already survives in Vault regardless
of what the dashboard shows).

## Source

BC-076-Card2a live investigation, 2026-09-02 — `control.client_connections`
read directly via Supabase MCP, cross-checked against the human's own
report of what they'd connected on each account.
