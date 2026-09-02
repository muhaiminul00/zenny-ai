# Testing — Zenny Dashboard

100% test coverage is the key to great vibe coding. Tests let you move fast,
trust your instincts, and ship with confidence — without them, vibe coding is
just yolo coding. With tests, it's a superpower.

**Scope note:** this covers the Dashboard React app only
(`05_Platform_Builds/Dashboard/`). The rest of this project (n8n workflows,
Supabase schema/RPCs, Edge Functions) has no comparable test framework and is
verified live against the real Supabase project instead — that doctrine is
unchanged and documented in the root `CLAUDE.md`. Bootstrapped 2026-09-02
during `/qa` on the admin-provision-client-picker-fix branch; this app had
zero tests before that.

## Framework

- **Vitest 4** — Vite-native test runner, config lives in `vite.config.ts`'s
  `test` block (no separate `vitest.config.ts`).
- **@testing-library/react** — renders components and queries them the way a
  user would (by role/label text), not by implementation detail.
- **jsdom** — the DOM environment tests run in.
- **@testing-library/jest-dom** — adds DOM matchers (`toBeInTheDocument`,
  etc.) to `expect`, wired via `src/test/setup.ts`.

## Running tests

```bash
npm run test        # run once (CI mode)
npm run test:watch  # watch mode, for local development
```

CI runs `npm run test` + `npx tsc -b` + `npm run lint` on every push/PR to
`main` — see `.github/workflows/test.yml`.

## Conventions

- Test files are co-located with the component they test:
  `AdminProvision.tsx` → `AdminProvision.test.tsx`, same directory.
- Mock `../lib/supabase` and `../lib/AuthContext` at the module level
  (`vi.mock(...)`) rather than reaching into real Supabase calls — this app
  has no test-database story, and the project's real backend verification
  already happens live (curl/browser) during Execute, not through this
  suite.
- Query by role and label text (`getByRole`, `getByLabelText`), not by CSS
  class or test-id, so tests break when real user-facing behavior breaks —
  not when an unrelated class name changes.
- Never assert `toBeDefined()`/`not.toThrow()` alone — assert the actual
  behavior (what text renders, what the mocked call was invoked with).

## Test layers (as this suite grows)

- **Unit/component tests** (what exists today): one component + its direct
  dependencies, mocked. Fast, no network.
- **Integration tests**: not yet used — would mean multiple real components
  wired together, still with Supabase mocked.
- **E2E/browser tests**: intentionally NOT part of this suite — that's
  `gstack /browse` against a running dev server pointed at the real Supabase
  project, run manually during `/qa`/Execute verification. Keeping the two
  separate: this suite is fast and hermetic; `/browse` passes are the real
  "does this actually work against production data" check.
