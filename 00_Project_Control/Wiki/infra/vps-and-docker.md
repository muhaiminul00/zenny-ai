# VPS & Docker Setup

**Status:** current as of 2026-08-07 (BC-033)

## What's true now

**All Zenny infrastructure runs on one VPS:** `srv1881104` (id 1881104),
KVM 1, 1 CPU / 4096MB RAM / 51200MB disk, Ubuntu 24.04 + Docker +
Traefik template, IPv4 `187.127.217.123`. This is the same VPS already
hosting the n8n instance (`n8n-cbzu.srv1881104.hstgr.cloud`). A second
VPS, `1729215`, exists but is explicitly out of scope for Zenny — never
touched.

**Managed via Hostinger's own project-management API only** — no SSH
key/config exists in this environment, so all Docker Compose lifecycle
actions go through the Hostinger VPS MCP tools
(`VPS_restartProjectV1`, `VPS_createNewProjectV1`,
`VPS_getProjectLogsV1`, `VPS_getProjectContainersV1`, etc.), never
direct shell access.

**Docker Compose projects running on srv1881104:**
- `traefik` — reverse proxy, `network_mode: host`.
- `n8n-cbzu` — the existing n8n instance.
- `zenny-dashboard` — the client-facing dashboard app.
- `zenny-auth` — the `auth.zeromanuals.com` OAuth proxy (added BC-033;
  see [[traefik-proxies]]).

**Traefik's real config** (Docker-labels provider, not file-based):
`--providers.docker=true`, `exposedbydefault=false`; TLS via Let's
Encrypt ACME HTTP-01 challenge, cert storage in a named volume
(`traefik-letsencrypt`), HTTP→HTTPS redirect at the entrypoint level.
Every new service mirrors the same working label pattern:
`traefik.enable=true` + a `Host()` rule + `entrypoints=websecure` +
`tls.certresolver=letsencrypt` + `loadbalancer.server.port` (or
`loadbalancer.server.url` for a proxy target).

**The dashboard app's real deployment mechanism:** a stock
`node:22-alpine` image that clones the (public) `zenny-sync` repo at
container start, runs `npm ci` + `npm run build`, and serves the built
`dist/` via `npx serve` — entirely inline in the compose file's
`command:`. No custom image or registry is used; see
[[platform-limitations]] for why (Hostinger's Compose orchestration
cannot `docker compose build`).

**Container restart is self-healing, not fragile:** the container's own
start command does `rm -rf /src/* ...` before its fresh `git clone`, so
an in-place restart (host reboot, Traefik-triggered restart, anything
using `restart:` semantics) will not crash-loop even though the
entrypoint always clones fresh. This was a real fix — see
[[platform-limitations]] for the original crash-loop bug it corrects.

**Resource headroom (as of the placeholder-deployment baseline, BC-014):**
~1GB RAM used / 4096MB total, ~4GB disk used / 51200MB total, negligible
CPU — massive headroom remained for the real dashboard app. Each new
lightweight service (nginx:alpine placeholder, the zenny-auth proxy
container) costs single-digit MB of RAM and is not a capacity concern at
this VPS's current scale.

## Why (if a non-obvious decision)

Hostinger's project-management API was used instead of SSH specifically
because no SSH key/config exists in this environment — this is an
environment constraint, not a deliberate architectural preference, and
is worth knowing before assuming direct shell access is available for
any future infra work.

## Gotchas

- `VPS_restartProjectV1` restarts the SAME container in place (reusing
  its writable filesystem layer) — it does NOT recreate the container.
  If a container's entrypoint does something that isn't idempotent on a
  reused filesystem (like a fresh `git clone` into a directory that
  already exists), a restart can crash-loop. Use
  `VPS_createNewProjectV1` (same project name) for a full recreate when
  that matters, or make the entrypoint self-healing (as done for
  `zenny-dashboard`).
- Traefik only needs *a* running container to hang labels on — a
  proxy-only service's `loadbalancer.server.url` label fully overrides
  the actual backend address, so the label-holding container itself
  doesn't need real network reachability to the true backend (used for
  the `zenny-auth` proxy, whose `nginx:alpine` container never actually
  talks to Supabase directly).

## Source

- BC-014 Infrastructure section, `PROJECT_STATE.md` (read directly, not via log.md)
- `Infrastructure Correction (BC-016) — DNS ownership + HTTPS cert now trusted` (log.md, 2026-08-05)
- `Phase 5 — 5B Order Lookup Dashboard (BC-015 — BUILT + DEPLOYED)` (log.md, 2026-08-05)
- `Session Log — Session 33 — BC-033 COMPLETE...` (log.md, 2026-08-07)
