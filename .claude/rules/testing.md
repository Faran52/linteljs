---
paths:
  - "**/*.{test,spec}.ts"
  - "**/__mocks__/**/*"
  - "**/vitest.config.ts"
---

# Testing Rules

`packages/create/assets/claude-rules/testing.standard.md` is the standard. Read it there rather
than in a copy. The eight per-target `testing.*.md` heads do not apply: this workspace has no
component framework and no DOM.

What follows is only where this repository differs, and the infrastructure that file does not
describe.

## Deviations

- **Comments are allowed, and wanted.** The standard bans them in tests. That rule came from a
  private app. This repo is public and people read its tests to learn how a rule is built, so
  comment where the reason is not on the screen: why a fixture is shaped that way, why a branch
  exists, what a fix deliberately does not do. Do not narrate. `packages/eslint-plugin/CLAUDE.md`
  is the long form of this.
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
  there as well as in the rule's own suite: one nasty input then covers all fourteen rules.
- `packages/create/src/pipeline/e2e/*.e2e.test.ts` files are excluded from the default run by their
  `.e2e.` infix. Each is four lines: the cases come from `cases.ts`, which enumerates them rather than
  listing them, so a new answer is covered the day the model gains it and not the day someone
  remembers. 98 cases, each one a real scaffold, install and `check`.
- **The cases are two families, and between them every answer.** `managerCases` is every target on
  every package manager with every multi-select at full value: the heaviest dependency set a target
  has, installed four ways, which is what catches a library breaking a project and a manager resolving
  the same manifest differently. `optionCases` is every combination of the single-select axes on pnpm
  alone, because a manager does not decide which config is emitted. Multiplying the two together is
  what made the matrix 1200; kept apart they are 327, and the one case per target they share is
  dropped.
- **`optionCases` covers every pair of answers, not every combination.** Greedy set cover over the
  legal enumeration takes 327 to 98. Every defect the suite has found was a two-way interaction, and
  `cases.test.ts` pins both halves: that no reachable pair is lost, and that the combination behind
  each of those defects survives. `E2E_FULL=1` runs the cross product for a pre-release sweep.
- **One registry on one fixed port, always.** Sharding is `E2E_SHARD`/`E2E_SHARDS`, a stride over the
  ordered case list inside one process, not vitest's own `--shard`: vitest splits by file, and the
  nine files hold 11 to 91 cases each. `e2e.yml` runs four shards, one machine each, so no machine
  ever holds two registries. That is also what keeps bun usable, since `bunx` and `bun create`
  answered `ConnectionRefused` whenever a second port existed on the same machine.
- **Parallelism is `maxConcurrency`, not more processes.** Files run one at a time and the cases in a
  file run together, which is why `run` spawns asynchronously: a `spawnSync` install blocks the event
  loop and serialises the whole file. `E2E_CONCURRENCY` sets the width, two by default and two per
  CI runner. Four was the earlier default and starved the build leg, which is almost entirely I/O:
  `ng build` alone is 65s and exceeds fifteen minutes with three siblings. Only `managerCases` is
  not pnpm and its four cases sit at the head of one file, so at most one bun, one yarn and one npm
  install is ever in flight.
- **That suite installs the checkout, never npm.** `registrySetup.ts` starts a Verdaccio in front
  of npmjs, publishes the three workspace packages into it, and installs the CLI from it; every
  case then runs one `create-linteljs` command with answer flags, the way a user does, with the
  registry set in the environment. Nothing under `@linteljs/*` is ever fetched from the real
  registry, so the suite tests exactly what is unreleased.
- **That suite never skips.** A registry that fails to start or publish throws in `globalSetup`:
  there is no state in which installing nothing is expected. It previously guarded itself with
  `describe.skipIf`, which meant a pack that produced nothing reported a green run having installed
  nothing. The only legitimate skip is a `-t` filter on the command line, and the count it prints
  as skipped is the cases the filter excluded, not cases the suite declined.
