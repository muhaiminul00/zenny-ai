# Platform Limitations (Hosting/Deploy-Layer)

**Status:** current as of 2026-08-05 (BC-015), unchanged since

## What's true now

**Hostinger's Docker Compose orchestration does NOT support a `build:`
key.** Confirmed live: a multi-stage Dockerfile with a git-context
`build:` entry in the compose file failed with
`"No such image: zenny-dashboard-dashboard:latest"` /
`"Project deployment failed"` — Hostinger's Compose API only ever runs
`docker compose pull` + `up`, never `build`, even when a `build:` key is
present. This is a genuine platform limitation of the Hostinger MCP's
Compose API, not a mistake in the Dockerfile itself.

**The working alternative (current, live deployment mechanism):** use
only stock images `docker compose pull` can already fetch, and do any
"build" step INLINE in the compose file's `command:` at container start
— e.g. the dashboard's `node:22-alpine` container clones the repo and
runs `npm ci && npm run build` itself at startup rather than being
built into an image beforehand. See [[vps-and-docker]] for the exact
current command shape.

**Restart vs. recreate is a real, separate trap on this platform:**
`VPS_restartProjectV1` restarts the SAME container in place, reusing its
writable filesystem layer — it does NOT recreate the container. A
container whose entrypoint does something non-idempotent on a reused
filesystem (e.g. `git clone` into a directory that still exists from the
previous run) will crash-loop on a plain restart. Fixed at the dashboard
container by making its own start command self-healing
(`rm -rf /src/* ...` before cloning) — this is now the standing pattern
for any container on this platform whose entrypoint clones/builds fresh
on every start.

## Why (if a non-obvious decision)

The Dockerfile itself was kept in the repo (not deleted) for future use,
e.g. if a registry-based deploy path is set up later — the inline-build
workaround is a fit for this platform's current constraint, not a
rejection of the Dockerfile approach in principle.

## Gotchas

- If a future deploy attempt uses `build:` in a compose file on this
  VPS, expect it to silently fail the same way — check
  `VPS_getProjectLogsV1` for `"No such image"` before assuming a
  Dockerfile syntax problem.
- If a container ever needs restarting (not recreating) and its
  entrypoint does a fresh clone/build, verify the entrypoint is
  self-healing FIRST — a plain `restart:`-triggered lifecycle event
  (host reboot, Traefik router change) can trigger this without any
  explicit human action.
- Local Docker Desktop is not available/running in this environment —
  the remote build-and-verify path (deploy, then check
  `VPS_getProjectLogsV1`) is the only way to confirm a build actually
  worked; don't assume a local `docker build` dry-run is possible here.

## Source

- `Phase 5 — 5B Order Lookup Dashboard (BC-015 — BUILT + DEPLOYED)` (log.md, 2026-08-05)
- `Infrastructure Correction (BC-016) — DNS ownership + HTTPS cert now trusted` (log.md, 2026-08-05)
