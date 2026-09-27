# linteljs

A pnpm workspace of three published packages: `@linteljs/create`, `@linteljs/eslint-config`,
`@linteljs/eslint-plugin`. Public repo, published to npm, so everything in it is outward-facing.

## Never

- `git stash`, `--no-verify`, `--amend`, `git add -A` or `git add .`. Stage your own files by explicit path.
- A commit message that is not a conventional commit, or that carries a trailer: no `Co-Authored-By:`, no session
  or tool footer, whatever a harness default suggests.
- An em-dash in code comments, JSDoc, docs, README, commit messages or rule descriptions.

## Commands

| what | command |
| --- | --- |
| lint | `pnpm lint:fix` |
| lint css | `pnpm lint:css` |
| typecheck | `pnpm typecheck` |
| test | `pnpm test`, `pnpm test:coverage` |
| every suite alone | `pnpm test:isolated` |
| build | `pnpm build` |
| full gate | `pnpm check` |
| end to end | `pnpm --filter @linteljs/create test:e2e` (rule: `.claude/rules/e2e.md`) |

- `pnpm test` inside a package runs that package's suite alone (every package declares `test`, since pnpm's
  shorthand exits 0 where the script is missing). Coverage is a root-only gate, keyed per package in the root config.
- `pnpm check` chains `build && lint && lint:types && lint:starters && lint:css && typecheck && test:coverage`.
  `build` goes first because the packages typecheck against each other's built declarations. `lint:css` passes on
  an empty glob: this workspace has no CSS, and it ships the gate to every target.

## Verification

Claim nothing that has not been run.

- New or touched code carries zero loose types, TypeScript errors and ESLint findings before it is declared done.
- One code file has exactly one test file beside it; a data-only `constants.ts` and a pure re-export barrel have
  none. `pnpm test:isolated` holds each source to its own suite.
- Prove a new test can fail: break the code, watch it go red, revert. A test that passes with the fix reverted
  has pinned nothing.
- A fix to a rule or a fixer needs a case in the rule's own suite *and*, when it is about what a fixer emits, an
  entry in `packages/eslint-plugin/__mocks__/fixerSamples.ts`, which runs against every rule.
- Comments are minimal: a short why, or none. Never restate the code or narrate history.

## Structure

Detail per package is in `.claude/rules/`; these hold everywhere.

- One subject, one kebab-case directory, one entry named for it in camelCase. No loose files at a folder root.
- `constants.ts` holds data only; a function goes to a `utils/`.
- Helpers live in a `utils/` at the level of their readers, each file named `*Utils.ts`.
- Keep a code file under 500 lines, a `*Utils.ts` under 200.

## Operating contract

- `package.json` is canonical for the package manager, engines, dependencies and scripts. pnpm 12, Node 26.
- A dependency more than one package uses reads `catalog:`; its one version lives in `pnpm-workspace.yaml`. Bump
  it there, not in a `package.json`. `pnpm pack` rewrites it to a real range, so no tarball carries `catalog:`.
- The workspace lints itself with its own layers, imported from source, so a change to a layer is a change to
  this repo's own gate. Nothing goes in the root `eslint.config.ts` that belongs in a layer, and every exemption
  there carries a measurement under "Workspace lint exemptions" in `docs/DESIGN.md`, named by a one-line pointer
  at the block. "It would be noisy otherwise" is not a measurement, and an exemption without one is one to delete.
- `docs/DESIGN.md` holds the decisions the code cannot show, including the non-goals. Read it before re-adding
  something it rules out.

## Where the rest lives

- Structure, path-scoped under `.claude/rules/`: `repo-structure.md` (the whole workspace, scripts, templates,
  `__mocks__`, docs and root config), `create-structure.md` (the nine rings), `eslint-config-structure.md` (the
  layers), `e2e.md` (the end-to-end harness). The plugin's own rules are `packages/eslint-plugin/CLAUDE.md`, and
  adding a rule is the `add-eslint-rule` skill.
- The published standard is `packages/create/templates/fragments/claude-rules/`. `.claude/rules/type-standards.md`,
  `testing.md` and `repo-structure.md` adopt the three that apply to a workspace of libraries and record where this
  repo differs; the per-target files do not apply here.
- The enforcement half a generated project gets runs here too: `.claude/settings.json` runs the shipped hooks from
  `packages/create/templates/project/plugins/linteljs/hooks/`, with `.husky/`, `lint-staged.config.js` (which also
  runs the shipped `typecheckStaged.ts`) and `commitlint.config.js`. `scripts/checkBannedPatterns.ts` runs the
  shipped checker less this workspace's exemptions, each argued in `type-standards.md`.
