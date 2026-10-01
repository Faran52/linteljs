---
paths:
  - "packages/create/src/pipeline/e2e/**/*"
  - "packages/create/vitest.e2e.config.ts"
  - ".github/workflows/e2e.yml"
---

# The end-to-end suite

`pnpm --filter @linteljs/create test:e2e` runs 214 cases, each a real generate, install and `check`, and is outside
`pnpm check` because every case hits the network. `docs/DESIGN.md`, "The end-to-end matrix", carries the why of
everything below.

- **Layout**: `matrix/matrix.ts` enumerates the cases (`targetCases`), `registry/registry.ts` is the
  `globalSetup`, `runner/runner.ts` runs one case, `targets/targets.e2e.test.ts` is the one file every target's
  cases run from. The `.e2e.` infix keeps it out of the default run. `starter-cover/` names the cases
  `pnpm lint:starters` installs (`STARTER_CASES`) and holds that they write every starter text; it runs in the
  default suite, and the root script lints those cases outside this harness.
- **Every pair, not every combination, under pnpm**: per target, a greedy cover keeps enough pnpm combinations
  that every pair of answer values appears once (174), each library its own on/off axis, `agents`, `plugins` and
  `surfaces` at their full value, `typeSafety` strict. `matrix.test.ts` holds that no reachable pair is lost and
  that each past defect's combination survives.
- **One smoke per other manager**: each target's widest case runs once on npm, Yarn 4 and bun (30), so every
  manager installs every dependency a target emits. React adds a `--skip fix` and a `--no-install` case.
- **Browser pass**: on the eight served targets the widest pnpm case also serves its build, loads every linked
  route in the system Chrome (`playwright-core`, `channel: 'chrome'`) and fails on a console error, a non-200 or a
  missing `h1`. Skipped on webextension (its pages are loaded from `dist/`, not served) and React Native (its web
  build is not what ships).
- **It installs the checkout, never npm**: a local Verdaccio on one fixed port publishes the three packages and
  installs the CLI from them. `E2E_UPSTREAM` replaces npmjs as its uplink; start such a run on an empty
  `.e2e-cache/registry`.
- **Knobs**: `E2E_PM` runs one manager's cases on whatever binary of it is on PATH (a yarn of the wrong major
  fails the run; unset, it runs every manager the machine has). `E2E_CONCURRENCY` sets the width (default two).
  `E2E_FULL=1` runs the whole cross product. `-t '<label>$'` runs one case.
- **It never skips**: a registry that fails to start throws in `globalSetup`. A count shown as skipped is what a
  `-t` filter excluded.
- **Async spawns only**: cases in a file run together under `maxConcurrency`, so a `spawnSync` install would
  serialise the file. `oneAtATime` holds one install per binary at a time, pnpm excepted.
