# DNS Ownership — zeromanuals.com

**Status:** current as of 2026-08-05 (BC-016), unchanged since

## What's true now

**Netlify is the real, authoritative DNS control plane for
`zeromanuals.com` — Hostinger is NOT, and never was.** Confirmed live:
`nslookup -type=NS zeromanuals.com 8.8.8.8` returns `dns1-4.p09.nsone.net`
— an NS1-backed zone that Hostinger's own DNS API does not actually
control.

**Any future DNS change for `zeromanuals.com` (or its subdomains) must be
made in Netlify's own DNS management UI, not via Hostinger's DNS API.**
Hostinger's DNS tools will accept a write without error, but it will not
take effect on the live zone — this looks like a propagation delay but
is actually a wrong-control-plane write.

**Known real records (as of BC-016):**
- `zenny.zeromanuals.com` → CNAME → `zeromanualai.github.io` (GitHub
  Pages, pre-existing, unrelated to this project — not reused).
- `www.zeromanuals.com` → CNAME → `zeromanuals.com`.
- `@` (root) — resolves inconsistently depending on which server
  answers (see Gotchas) — a different, unrelated service either way.
- `dashboard.zeromanuals.com` → A → `187.127.217.123` (added via
  Netlify, BC-016).
- `auth.zeromanuals.com` → A → `187.127.217.123` (added via Netlify
  before BC-033 was issued — pre-confirmed by the human).

## Why (if a non-obvious decision)

BC-014 originally wrote `dashboard.zeromanuals.com`'s A record via
Hostinger's own DNS API and diagnosed the resulting HTTPS cert failure
as "still propagating" — a real misdiagnosis. The write never reached
the zone NS1/Netlify actually serves, so no amount of waiting would have
fixed it. This was only caught in BC-016 by directly querying the zone's
real NS records rather than trusting Hostinger's DNS API as
authoritative. **Do not repeat BC-014/BC-015's misdiagnosis** — this
correction is the standing reference for all future sessions.

## Gotchas

- `zeromanuals.com`'s root (`@`) record resolves to DIFFERENT IPs
  depending on which server answers: Hostinger's own API reports
  `2.57.91.91`, but the domain's actual authoritative NS1 servers report
  `52.74.6.109` / `13.215.239.219` (AWS-range IPs) when queried directly.
  This is the exact same root cause as the misdiagnosis above (Hostinger
  is not authoritative) — not a separate bug, and not something to
  "fix" by writing to Hostinger's DNS API.
- If a future HTTPS cert issuance fails with a DNS-lookup error
  (`NXDOMAIN`) right after a DNS write, check WHICH DNS provider the
  write actually went to before assuming a propagation delay.
- Subdomain naming: `dashboard` was chosen over the more obvious `zenny`
  specifically because `zenny.zeromanuals.com` was already taken by the
  pre-existing GitHub Pages CNAME — confirmed via a live DNS check
  before picking a name, not guessed.

## Source

- `Infrastructure Correction (BC-016) — DNS ownership + HTTPS cert now trusted` (log.md, 2026-08-05)
- BC-014 Infrastructure section, `PROJECT_STATE.md` (read directly, not via log.md)
- `Session Log — Session 33 — BC-033 COMPLETE...` (log.md, 2026-08-07)
