# OAuth Redirect Domain / Traefik Proxy

**Status:** current as of 2026-08-07 (BC-033)

## What's true now

`oauth-initiate` does NOT build the `redirect_uri` string in code — it
reads `app.redirect_uri` from `control.oauth_apps` via `get_oauth_app()`,
a stored per-provider config value. Changing a provider's redirect
domain is a database UPDATE (via a tracked migration), not an Edge
Function code change or redeploy.

**Current values, per provider:**
- **Google:** `https://auth.zeromanuals.com/oauth-callback` (updated
  BC-033).
- **Shopify / Calendly / Cal.com / Slack:** still the original raw
  Supabase project-ref domain,
  `kmhzosyljpzheqvfuyzm.supabase.co/functions/v1/oauth-callback` — NOT
  migrated. Updating them was explicitly out of BC-033's scope, since
  their consoles weren't also being updated in the same session and a
  mismatch would break their real authorize flows.

**The proxy itself (`auth.zeromanuals.com`):** a new Traefik router
(`zenny-auth` Docker Compose project on the VPS) sitting in front of
Supabase's real oauth-initiate/oauth-callback Edge Functions, fronted by
a real trusted Let's Encrypt certificate. One `nginx:alpine` container
carries all 3 routers' labels — Traefik's Docker provider only needs
*a* running container to hang labels on, since the two OAuth services'
`loadbalancer.server.url` labels fully override the actual backend
address.

**The real, confirmed Host-header-rewrite mechanism:**
`loadbalancer.passhostheader=false` on the service, combined with a
DNS-named (not IP-based) `server.url`. With `passHostHeader` false,
Traefik's underlying Go HTTP client naturally uses the target URL's own
hostname as the outbound Host header instead of forwarding the inbound
request's Host — this is what lets Supabase's gateway accept the proxied
request instead of rejecting a mismatched Host header (Cloudflare,
fronting Supabase, returns a hard `403 Forbidden` for a naively
proxied/mismatched Host header — confirmed live in BC-020, before the
proxy existed).

**Path rewrite:** Supabase Edge Functions live at `/functions/v1/{name}`,
not bare `/oauth-initiate` — an `addPrefix` middleware
(`prefix=/functions/v1`) handles this; query strings (state UUIDs,
provider params) pass through untouched by path-only middlewares.

**`/health` endpoint:** served locally by the same nginx container (a
static `ok` file written at build/start time) — NOT proxied to Supabase,
independent of Supabase's own health.

## Why (if a non-obvious decision)

An earlier investigation (BC-020) assumed the mechanism would be
`customRequestHeaders.Host` — this does NOT work; a Traefik maintainer
states directly on the community forum that Traefik does not support
modifying the Host header that way, since it interferes with how the
proxy works. This was discovered as a genuinely new platform-behavior
finding while actually building the proxy (BC-033), not assumed from the
earlier feasibility investigation's own (incorrect) reasoning.

The proxy does **not** fix Google's "unverified app" warning — that is
gated entirely by the OAuth app's Publishing Status (Testing/Production)
in Google Cloud Console, independent of which domain serves the
redirect_uri (confirmed live, BC-020). The proxy's real, confirmed
benefit is cosmetic/branding: Google's consent screen and Authorized
Domains list now show `zeromanuals.com` instead of the raw Supabase
domain — a genuine verification-review positive (consistent branding
across home page/consent screen/redirect), just not the fix for the
original "unverified app" friction it was first investigated for.

## Gotchas

- "Authorized domains" on Google's OAuth consent screen only needs the
  bare root `zeromanuals.com` — Google authorizes subdomains
  automatically once the root is authorized; `auth.zeromanuals.com` does
  not need a separate entry.
- Don't assume the proxy migration is complete for all providers — only
  Google's `redirect_uri` was actually moved to `auth.zeromanuals.com`.
  Check `control.oauth_apps.redirect_uri` per-provider before assuming
  which domain a given provider's console needs to have registered.
- A DNS-named `server.url` (not an IP) is required for the
  `passHostHeader=false` mechanism to work correctly — using a raw IP
  address as the backend URL would defeat the hostname-based rewrite.

## Source

- `Session Log — Session 33 — BC-033 COMPLETE: auth.zeromanuals.com Traefik proxy live...` (2026-08-07)
- `Phase 5 — OAuth Popup Flow + Proxy-Domain Feasibility (BC-020)` (2026-08-05)
- `Prior Phase — BC-020 OAuth Popup Flow + ADP-002 Convocore Adapter COMPLETE` (2026-08-05)
