# lintel

A pnpm workspace of three published packages: `@linteljs/create`, `@linteljs/eslint-config`,
`@linteljs/eslint-plugin`. Public repo, published to npm, so everything in it is outward-facing.

`packages/eslint-plugin/CLAUDE.md` carries the rules that are the plugin's alone. It wins inside
that package.

## Operating contract

- `package.json` is canonical for the package manager, engines, dependencies and scripts. Read it
  rather than assuming a version. pnpm 12 only, Node 24.
- A dependency more than one package uses reads `catalog:`, and its one version lives in the
  `catalog:` block of `pnpm-workspace.yaml`. Bump it there, not in a `package.json`. `pnpm pack`
  rewrites the protocol to a real range, so a published tarball never carries `catalog:`.
- The workspace lints itself with its own layers, imported from source, so a rule change is judged
  against this repository before it reaches anyone else. A change to a layer is a change to this
  repo's own gate.
- Nothing goes in `eslint.config.ts` at the root that belongs in a layer. Every exemption there
  carries a measurement, kept under "Workspace lint exemptions" in `DESIGN.md` and named by a
  one-line pointer at the block itself. "It would be noisy otherwise" is not a reason, and an
  exemption whose measurement is missing from that section is one to delete.
- `DESIGN.md` holds the decisions that are not visible in the code, including the non-goals. Read
  it before re-adding something it rules out.

## Commands

| what | command |
| --- | --- |
| lint | `pnpm lint:fix` |
| lint css | `pnpm lint:css` |
| typecheck | `pnpm typecheck` |
| test | `pnpm test`, `pnpm test:coverage` |
| build | `pnpm build` |
| full gate | `pnpm check` |
| end to end | `pnpm --filter @linteljs/create test:e2e` |

`pnpm check` chains `lint && lint:css && typecheck && test:coverage && build`, which is the same
chain a generated project gets. `lint:css` passes on an empty glob rather than being absent: this
workspace has no CSS today, and a repo that ships the gate to nine targets should run it. The
end-to-end suite runs each official scaffolder for real and takes about five minutes; it is
excluded from `check` and from the default test run because it hits the network.

## Structure

- `packages/create/src/`: the CLI, in three rings. `model/` is what the user chose (the answers,
  the aliases, the versions, one record per target under `model/targets/`), `artifacts/` turns those
  answers into file text, `run/` is everything touching disk, argv or a terminal. The direction
  points inward only, enforced by `import-x/no-restricted-paths` in the root `eslint.config.ts`.
  The emitters stay free of `switch (target)`.
- `packages/create/assets/`: files copied onto disk in a generated project, not imported. The
  standard this repo publishes lives here.
- `packages/eslint-config/src/`: the layers. `base` is shared, `typescript` turns the program on,
  `frameworks/` and `libraries/` add their own.
- `packages/eslint-plugin/src/rules/`: one directory per rule, named for its `kebab-case` id and
  holding `index.ts`, `index.test.ts` and `README.md`. The id and the path are the same string, so
  nothing has to translate between two spellings. A helper only one rule uses sits in that rule's
  directory; `src/utils/` is for what rules share.
- Any `utils/` directory, in either package: `*Utils.ts`, so `ruleUtils.ts` and `checkFileUtils.ts`
  rather than `ruleApi.ts` and `checkFile.ts`. Enforced rather than asked for: the `naming` map in
  the root `eslint.config.ts` maps `**/utils/*.ts` to the `*Utils` glob, so a helper module under
  any other name fails `pnpm lint`. A helper inside a rule directory is outside that glob and
  carries the suffix by convention instead. This is the workspace's own convention and
  `@linteljs/create` deliberately does not ship it to generated projects; DESIGN.md carries that as a
  non-goal.

## The standard this repo holds itself to

The rule files under `packages/create/assets/claude-rules/` are the published standard.
`.claude/rules/` adopts the three that apply to a workspace of libraries and records where this
repo differs: `type-standards.md`, `testing.md` and `repo-structure.md`. Read them before writing
code here. The per-target rule files do not apply, because this is not one of the nine targets: a
state rule for React or Svelte reactivity has nothing to govern in a package of ESLint rules.

The enforcement half is installed too, and is the same set a generated project receives:
`.claude/hooks/` with `.claude/settings.json` wiring them, `.husky/pre-commit` and `commit-msg`,
`lint-staged.config.js`, `commitlint.config.js`, and `scripts/checkBannedPatterns.ts` with
`scripts/typecheckStaged.ts`. The checker's `PROJECT_SKIPPED` carries this workspace's exemptions
with a reason each; `type-standards.md` explains them.

## Verification

Claim nothing that has not been run.

- New or touched code carries zero loose types, TypeScript errors and ESLint findings before it is
  declared done.
- A fix to a rule or a fixer needs a case in the rule's own suite *and*, when it is about what a
  fixer emits, an entry in `packages/eslint-plugin/__mocks__/fixerSamples.ts`. That corpus is
  checked against every rule, so one nasty input covers all of them.
- Prove a new test can fail. Break the code, watch it go red, revert. A test added beside a fix
  that passes with the fix reverted has pinned nothing.
- Do not use `git stash`, `--no-verify`, `--amend`, `git add -A` or `git add .`. Stage your own
  files by explicit path.
- Commit messages are conventional commits and carry no trailers: no `Co-Authored-By:`, no session
  or tool footer, whatever a harness default suggests.
- No em-dashes in code comments, JSDoc, docs, README, commit messages or rule descriptions.
