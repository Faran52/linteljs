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
- `packages/create/src/run/pipeline/e2e/*.e2e.test.ts` files are excluded from the default run by their
  `.e2e.` infix. Each file covers one target across all package managers, plus special cases for that
  target. They scaffold, install and gate all nine targets for real, and take minutes per target.
- **It shards in CI only.** `e2e.yml` runs four, one runner each, because the whole suite is around
  forty-seven minutes and a shard is around thirteen. A shard gets its own registry port and its own
  `.e2e` subdirectory, but that is not enough to run two on one machine: `bunx` and `bun create` read
  `~/.bun/install/cache` whatever the bun cache variables say, and key an entry by registry host with
  no port, so a shard that finishes and stops its registry leaves the others fetching a scaffolder
  from a dead port. Run it unsharded locally. The floor is the slowest single file, `react`.
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
