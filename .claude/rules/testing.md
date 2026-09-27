---
paths:
  - "**/*.{test,spec}.ts"
  - "**/__mocks__/**/*"
  - "**/vitest.config.ts"
---

# Testing Rules

`packages/create/templates/fragments/claude-rules/testing.standard.md` is the standard. Read it there rather
than in a copy. The eight per-target `testing.*.md` heads do not apply: this workspace has no
component framework and no DOM.

What follows is only where this repository differs, and the infrastructure that file does not
describe.

## Deviations

- **Comments are minimal.** A short why, or none: only where the reason is not on the screen, such as why a
  fixture is shaped that way. Never narrate. `packages/eslint-plugin/CLAUDE.md` says the same.
- **No DOM, no jest-dom, no RTL.** Nothing here renders. The "behaviour" a test asserts is what a
  rule reports, what a fixer emits, and what an emitter writes.
- **Coverage.** The 100% bar holds for all three packages, on statements, branches, functions and
  lines. The root `vitest.config.ts` carries the thresholds; never lower one to make a run pass.
  A branch a type demands and reality cannot reach is usually dead code, and deleting it beats
  covering it or ignoring it.

## Infrastructure

- Vitest, one project per package (`projects: ['packages/*']` at the root). Globals are on.
- All three packages colocate their tests as `src/**/X.test.ts` beside the source. No package has
  a `test/` directory; shared helpers and fixture files live in `__mocks__/` at package root.
- Rules are tested through `RuleTester` (`__mocks__/ruleTesters.ts`). Layers are tested by linting
  real text through a real `ESLint` (`packages/eslint-config/__mocks__/lintText.ts`), never by
  reading the config object back.
- `__mocks__/fixerSamples.ts` is a shared corpus run against **every** rule. A fixer defect belongs
  there as well as in the rule's own suite: one nasty input then covers every rule.
- `packages/create/src/pipeline/e2e/**/*.e2e.test.ts` files are excluded from the default run by their
  `.e2e.` infix. One file holds every target: the cases come from `matrix.ts`, which enumerates them
  rather than listing them, so a new answer is covered the day the model gains it and not the day
  someone remembers. 209 cases, each one a real generate, install and `check`.
- **Every pair of answers, not every combination.** Per target, every legal combination of the
  single-select axes on every package manager is enumerated, and a greedy set cover keeps enough of
  them that every pair of answer values appears at least once. The package manager is one of those
  axes. A multi-select is never combined: every case carries it at its full value, the heaviest
  dependency set a target has. Every defect the suite has found was a two-way interaction, and
  `matrix.test.ts` pins both halves: that no reachable pair is lost, and that the combination behind
  each of those defects survives. `E2E_FULL=1` runs the cross product for a pre-release sweep.
- **One manager per run in CI, named by `E2E_PM`.** The suite runs only that manager's cases, on
  whatever binary of it is on PATH, and reads its version from `--version` as a user's run would.
  Both yarns answer to `yarn`, so no one machine can carry the two, and a yarn of the wrong major
  fails the run before any case rather than recording the other manager. Unset, a run takes every
  manager this machine answers for, which on a machine with yarn 1 is everything but `yarn`.
  `e2e.yml` runs one job per manager and sets up only that manager.
- **One registry on one fixed port, always.** Each CI job is its own machine, so no machine ever
  holds two registries, and Yarn's global metadata cache, which stores tarball URLs with the port,
  stays valid between runs.
- **Parallelism is `maxConcurrency`, not more processes.** Files run one at a time and the cases in a
  file run together, which is why `run` spawns asynchronously: a `spawnSync` install blocks the event
  loop and serialises the whole file. `E2E_CONCURRENCY` sets the width, two by default and two per
  CI runner. Four was the earlier default and starved the build leg, which is almost entirely I/O:
  `ng build` alone is 65s and exceeds fifteen minutes with three siblings. `oneAtATime` holds one
  install per binary at a time, pnpm excepted, because yarn's and bun's caches are not built for a
  second writer.
- **That suite installs the checkout, never npm.** `registry/registry.ts` starts a Verdaccio in front
  of npmjs, publishes the three workspace packages into it, and installs the CLI from it; every
  case then runs one `create-linteljs` command with answer flags, the way a user does, with the
  registry set in the environment. Nothing under `@linteljs/*` is ever fetched from the real
  registry, so the suite tests exactly what is unreleased. `E2E_UPSTREAM` replaces npmjs as the
  uplink on a network that cannot reach it; a storage filled through npmjs still fetches the
  tarballs it already listed from npmjs, so start such a run on an empty `.e2e-cache/registry`.
- **That suite never skips.** A registry that fails to start or publish throws in `globalSetup`:
  there is no state in which installing nothing is expected. It previously guarded itself with
  `describe.skipIf`, which meant a pack that produced nothing reported a green run having installed
  nothing. The only legitimate skip is a `-t` filter on the command line, and the count it prints
  as skipped is the cases the filter excluded, not cases the suite declined.
