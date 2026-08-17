# Traefik Proxies — dashboard.zeromanuals.com & auth.zeromanuals.com

**Status:** current as of 2026-08-07 (BC-033)

## What's true now

Two public-facing domains are proxied through the same Traefik instance
on the VPS (see [[vps-and-docker]]), both terminating real trusted
Let's Encrypt certificates:

**`dashboard.zeromanuals.com`** — the client-facing React dashboard app
itself (not an OAuth proxy). Single app, path-routed (`/orders`,
`/appointments`, `/integrations`, etc., all one Traefik router, one
Supabase Auth session). Cert: `Issuer: CN=YR2, O=Let's Encrypt, C=US`,
confirmed via a real certificate-chain read (not just a successful
curl), issued after BC-016's DNS-ownership correction let ACME actually
resolve the domain.

**`auth.zeromanuals.com`** — a reverse proxy IN FRONT OF Supabase's
`oauth-initiate`/`oauth-callback` Edge Functions, added BC-033. This is
purely a routing/branding layer — the actual OAuth logic still lives in
Supabase; nothing was moved off Supabase. Cert:
`Issuer: C=US, O=Let's Encrypt, CN=YR1`, `Subject: CN=auth.zeromanuals.com`,
valid through 2026-11-05.

**The real, confirmed Host-header-rewrite mechanism** (this is the
non-obvious part): `loadbalancer.passhostheader=false` on the Traefik
service, combined with a DNS-named (not IP-based) `server.url`. With
`passHostHeader` false, Traefik's underlying Go HTTP client naturally
uses the target URL's own hostname as the outbound Host header instead
of forwarding the inbound request's Host — this is what lets Supabase's
gateway (fronted by Cloudflare) accept the proxied request instead of
403-rejecting a mismatched Host header. `customRequestHeaders.Host` —
the mechanism an earlier feasibility investigation (BC-020) assumed
would work — does NOT work; a Traefik maintainer states directly that
Traefik does not support modifying the Host header that way.

**Path rewrite:** Supabase Edge Functions live at `/functions/v1/{name}`,
not bare `/oauth-initiate` — an `addPrefix` middleware
(`prefix=/functions/v1`) handles this; query strings (state UUIDs,
provider params) pass through untouched.

**`/health` on `auth.zeromanuals.com` is served locally, not proxied** —
the same container writes a static `ok` file at build/start time and
serves it directly, independent of Supabase's own health.

Full detail on which OAuth providers' `redirect_uri` actually point at
`auth.zeromanuals.com` (only Google, as of BC-033) lives in
[[../credentials/oauth-redirect-and-proxy-domain]] — not duplicated
here to avoid drift between the two pages.

## Why (if a non-obvious decision)

The proxy does NOT fix Google's "unverified app" consent warning — that
is gated entirely by the OAuth app's Publishing Status in Google Cloud
Console, independent of which domain serves the redirect_uri (confirmed
live, BC-020, before the proxy existed). The proxy's real, confirmed
benefit is cosmetic/branding: a consistent `zeromanuals.com` domain
across the marketing site, consent screen, and redirect, which IS a
genuine positive for Google's verification review — just not the
specific fix for the original friction the proxy was first investigated
to solve.

## Gotchas

- Don't assume the auth proxy covers every OAuth provider — as of
  BC-033 only Google's `redirect_uri` was migrated. Check each
  provider's own stored `redirect_uri` before assuming which domain a
  given console needs registered.
- A DNS-named `server.url` (not a raw IP) is required for the
  `passHostHeader=false` rewrite mechanism to work — an IP-based backend
  URL would defeat the hostname-based rewrite.
- This proxy achieves the "branded custom domain" outcome WITHOUT
  requiring a Supabase Pro-tier upgrade — see [[supabase-tier-limits]]
  for why that matters (a Supabase-native custom domain would have
  required Pro; the VPS-side Traefik proxy was a genuinely cheaper
  alternative path to the same visible outcome).

## Source

- `Session Log — Session 33 — BC-033 COMPLETE: auth.zeromanuals.com Traefik proxy live...` (log.md, 2026-08-07)
- `Phase 5 — OAuth Popup Flow + Proxy-Domain Feasibility (BC-020)` (log.md, 2026-08-05)
- `Infrastructure Correction (BC-016) — DNS ownership + HTTPS cert now trusted` (log.md, 2026-08-05)
- BC-014 Infrastructure section, `PROJECT_STATE.md` (read directly, not via log.md)
