---
paths:
  - "packages/create/e2e/**/*"
  - "packages/create/vitest.e2e.config.ts"
  - ".github/workflows/e2e.yml"
---

# The end-to-end suite

`pnpm --filter @linteljs/create test:e2e` runs the matrix, each case a real generate, install and `check`, and is
outside `pnpm check` because every case hits the network. It runs in cloud CI only: `.github/workflows/e2e.yml`
starts it on a push to main or a `v*` branch, daily at noon UTC, and on `gh workflow run e2e.yml`, and
`globalSetup` throws when `CI` is unset. Read results with `gh run list --workflow e2e.yml` and
`gh run view <id> --log-failed`. `docs/DESIGN.md`, "The end-to-end matrix", carries the why of everything below.

- **Layout**: the harness is `packages/create/e2e/`, beside `__mocks__/` and outside `src/`, so it never ships
  and is held to lint as source (`@linteljs/workspace/e2e-source`) and to typecheck, but not to coverage,
  `test:isolated` or Stryker. `matrix/matrix.ts` enumerates the cases (`targetCases`), `registry/registry.ts` is the
  `globalSetup`, `runner/runner.ts` runs one case, `targets/targets.e2e.test.ts` is the one file every target's
  cases run from. The `.e2e.` infix keeps it out of the default run. `starter-cover/` names the cases
  `pnpm lint:starters` installs (`STARTER_CASES`), which the root script lints outside this harness. The harness
  is repo tooling and carries no suites of its own.
- **Every pair, not every combination, under pnpm**: per target, a greedy cover keeps enough pnpm combinations
  that every pair of answer values appears once, each library its own on/off axis, `agents`, `plugins` and
  `surfaces` at their full value, `typeSafety` strict.
- **One smoke per other manager**: each target's widest case runs once on npm, Yarn 4 and bun, so every
  manager installs every dependency a target emits. React adds a `--skip fix` and a `--no-install` case, and
  its widest case as a monorepo on every manager, which also commits through the hooks, and on pnpm once more
  after `sync --add lib`.
- **Browser pass**: on the eight served targets the widest pnpm case also serves its build, loads every linked
  route in the system Chrome (`playwright-core`, `channel: 'chrome'`) and fails on a console error, a non-200, a
  missing `h1` or an animation running under reduced motion. A ninth runs the widest React Router framework-mode
  case on npm, and adds a 404 from its catch-all. With `languages`, a server-rendered pass holds that the raw HTML
  carries the chosen `lang` and `dir`. Skipped on webextension (its pages are loaded from `dist/`, not served),
  React Native (its web build is not what ships) and typescript (a library has no page).
- **It installs the checkout, never npm**: a Verdaccio on the runner, on one fixed port, publishes the three
  packages and installs the CLI from them. Its storage, `.e2e-cache/registry`, is cached per ISO week.
- **Knobs**, each set per job by `e2e.yml`: `E2E_PM` runs one manager's cases on whatever binary of it is on PATH
  (a yarn of the wrong major fails the run). `E2E_CONCURRENCY` sets the width (default two). `E2E_SHARD=2/4` runs
  every fourth case from the second, which splits pnpm four ways.
- **It never skips**: a registry that fails to start throws in `globalSetup`.
- **Async spawns only**: cases in a file run together under `maxConcurrency`, so a `spawnSync` install would
  serialise the file. `oneAtATime` holds one install per binary at a time, pnpm excepted.
- **Each case removes its own tree** as it ends, pass or fail (`removedAfter` in `utils/cleanupUtils.ts`), so the
  `afterAll` hook only removes the emptied workspace and never outruns its timeout.
