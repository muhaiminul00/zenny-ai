# Supabase Tier & Limits

**Status:** current as of 2026-08-07 (BC-033)

## What's true now

The Zenny Supabase organization (`jltlethfyimcwhtbbeqj`, "Zenny AI") is
on the **free tier** — confirmed live via `get_organization`, not
assumed. No upgrade to Pro has occurred as of the most recent log entry
that touches this.

**Real consequence of free tier:** Supabase does not offer a native
custom-domain mapping for Edge Functions (`oauth-initiate`,
`oauth-callback`) on the free tier — that specific capability requires
Supabase Pro. This was flagged (BC-019) as a plan/cost decision for the
human, never actioned.

**This limitation was worked around, not lifted:** BC-033 built a
VPS-side Traefik reverse proxy (`auth.zeromanuals.com`, see
[[traefik-proxies]]) that achieves the same visible outcome — a branded
domain in front of the OAuth Edge Functions — entirely outside Supabase,
at no Supabase-tier cost. **Supabase itself is still on the free tier as
of the most recent entry; the custom-domain need was solved by NOT
upgrading, via the proxy instead.** If any future decision assumes "we
needed Pro for the branded OAuth domain," that assumption is now
outdated — the proxy is the live mechanism.

**Two real Supabase projects exist in this account, both
`ACTIVE_HEALTHY`:**
- `zenny-vault` (id `kmhzosyljpzheqvfuyzm`, `ap-northeast-2`) — the
  correct, documented, actively-used project for all Zenny work.
- `zenny-dashboard` (id `bzckrqgasqiglsgqyzft`, `ap-south-1`) — an
  undocumented second project, likely a teammate's earlier standalone
  reference build. Not investigated further as of the most recent
  mention; not used by any current Zenny infrastructure.

## Why (if a non-obvious decision)

Not upgrading to Pro was never a formal decision to skip the capability
— it was left open as a cost/plan call for the human, and the proxy
route was pursued instead because it was "technically light to build
(~half a session: 1 DNS record, 1 Traefik router, 2 redirect_uri values
kept in sync) and inexpensive (VPS-hosted, no Supabase Pro required)."

## Gotchas

- Don't assume `zenny-dashboard` (the second Supabase project) is
  related to the actual deployed dashboard app — the deployed dashboard
  app (`dashboard.zeromanuals.com`) uses `zenny-vault` for all its data,
  same as everything else in this project. The similarly-named second
  project is a separate, unrelated, unused Supabase project.
- If Supabase Pro is ever actually purchased for a different reason
  (e.g. connection pooling, larger compute), re-check whether a native
  custom domain becomes worth switching to instead of the Traefik proxy
  — not evaluated either way as of the most recent log entry, since the
  proxy fully solved the problem it was needed for.

## Source

- `Phase 5 — Gmail/WooCommerce Connections, Inventory Sync Logged, Supabase Tier (BC-019)` (log.md, 2026-08-05)
- `Phase 5 — OAuth Popup Flow + Proxy-Domain Feasibility (BC-020)` (log.md, 2026-08-05)
- `Session Log — Session 33 — BC-033 COMPLETE...` (log.md, 2026-08-07)
- `MCP Configuration — Real Current State (BC-002)` (log.md, 2026-08-05)
