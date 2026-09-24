# linteljs

A pnpm workspace of three published packages: `@linteljs/create`, `@linteljs/eslint-config`,
`@linteljs/eslint-plugin`. Public repo, published to npm, so everything in it is outward-facing.

`packages/eslint-plugin/CLAUDE.md` carries the rules that are the plugin's alone. It wins inside
that package.

## Operating contract

- `package.json` is canonical for the package manager, engines, dependencies and scripts. Read it
  rather than assuming a version. pnpm 12 only, Node 26.
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

Every package declares `test` too, so `pnpm test` inside one runs that package's own vitest project and nothing
else. It exists because pnpm's `test` shorthand exits 0 in a package that has no such script, so the suite looked
green having run nothing. Coverage stays a root-only gate: the thresholds are keyed per package in the root config
and a package-level `--coverage` would answer a narrower question.

`pnpm check` chains `lint && lint:css && typecheck && test:coverage && build`, which is the same
chain a generated project gets. `lint:css` passes on an empty glob rather than being absent: this
workspace has no CSS today, and a repo that ships the gate to nine targets should run it. The
end-to-end suite is 209 cases, each a real generate, install and gate: per target, enough answer
combinations to cover every *pair* of answers, the package manager among the axes, with every
multi-select at its full value. It is excluded from `check` and from the default test run because
every case hits the network. `E2E_PM` runs one manager's cases on whatever binary of it is on PATH,
and a yarn of the wrong major fails the run; unset, it runs every manager the machine answers for.
Widen it with `E2E_CONCURRENCY`, and run the whole cross product with `E2E_FULL=1`; `DESIGN.md`
carries why the split is by manager rather than vitest's own `--shard`, and why pairs rather than
combinations.

## Structure

- `packages/create/src/`: the CLI, one folder per responsibility. `answers/` is what the user chose,
  `config/` is data and only data, the types, constants and tables no ring owns, `targets/` is what
  linteljs knows (one record per target, the registry, the naming policy),
  `emitters/` turns the two into file text, `terminal/` reads argv and the terminal, `disk/` reads
  and writes files, `spawns/` runs binaries, `pipeline/` sequences them. The direction points inward
  only, enforced by `import-x/no-restricted-paths` in the root `eslint.config.ts`, and which folder a
  module belongs to is decided by the world it reaches into rather than by judgement: `node:fs`
  means `disk/`, `node:child_process` means `spawns/`, argv and the terminal mean `terminal/`,
  enforced by `no-restricted-imports` in the same file. The emitters stay free of `switch (target)`.
  `packages/create/src/rings.ts` is the one list of the rings and their direction; the root
  `eslint.config.ts` builds its zones from it and `src/meta.test.ts` holds the tree to it.
- **Every ring has the same shape, and `src/meta.test.ts` holds the five that carry no registry.** A
  ring is named for what its members are, or for the world it reaches when the world is the
  membership test. A subject is a kebab-case directory holding one entry named for it in camelCase,
  its suite, a `constants.ts` for a table it alone owns, and a `utils/` for helpers only it reads.
  The entry takes the singular of whatever names the kind: the ring where the ring has one
  (`targets/` gives `reactTarget`, `spawns/` gives `gitSpawn`), the group where a group changes it
  (`disk/read/` gives `projectShapeReader`, `pipeline/passes/` gives `fixPass`). A ring with no one
  kind has nothing to suffix, so `terminal/` holds `cli/cli.ts` and `prompts/prompts.ts`. Every ring
  carries a barrel and the outer rings take it rather than reaching a file inside, which the same
  suite pins by refusing an export nothing outside the ring takes.
- `packages/create/src/emitters/`: `<group>/<subject>/<subjectEmitter>.ts`, three derivations of one
  spelling. The subject directory is named for the file it writes, the entry is named for the
  directory, and the group is named for the answer that decides whether its emitters write anything:
  `agents/`, `manager/`, `target/`, `testing/`, `libraries/`, `typesafety/`, and `always/` for the
  null one. Every entry answers `Artifact[]`, so a target with no vite config answers `[]` and
  `buildArtifacts` holds no branch: `registry.ts` is the list and `meta.test.ts` holds it against the
  directory listing both ways. A module that writes no file is not an emitter: `registry.ts` and the
  barrel sit at the root, a helper every subject reads under `emitters/utils/`, a table one subject
  owns in that subject's `constants.ts`.
  Two lists come out of `registry.ts` and every file reaches disk through `artifactWriter` from one
  of them. `buildArtifacts` is what `create` and `sync` both write from. `seedArtifacts` is what a
  `create` run plants and `sync` never touches: the recorded config, the README, the manifest and
  the starter source. `pipeline/passes/` is the one exception and a different operation, editing source a
  scaffolder already wrote.
- `packages/create/templates/`: files copied onto disk in a generated project, not imported. The
  standard this repo publishes lives here. Laid out as the destination rather than by consumer, in
  four siblings: `project/` is the tree a project receives, so `copied('lint-staged.config.js')`
  derives its source from where the file lands; `starter-source/` holds the per-target starters;
  `fragments/` holds the pieces joined into one file, which have no destination of their own and so
  keep an explicit list; `schemas/` is a mirror of the repository's own `schemas/` published under a
  raw URL rather than copied anywhere, which `answers/utils/schemaUtils.test.ts` holds against it.
- `packages/eslint-config/src/`: the layers, in the same subject shape as create's rings.
  `layers/<name>/<name>Layer.ts` for `base`, `typescript`, `vitest` and `html`,
  `frameworks/<name>/<name>Framework.ts` and `libraries/<name>/<name>Library.ts` for the rest. The
  file names carry the suffix and the exports do not: `baseLayer.ts` exports `base`. Each entry backs
  a published `exports` subpath through a keyed tsdown entry, so `dist/` stays flat however deep the
  source sits. `compose-config/composeConfig.ts` takes no suffix, since nothing names a kind for it,
  and its loader tables are code, so they sit in `utils/loaderUtils.ts` with a suite beside them.
  `index.ts` and `types.ts` stay at the root, `config/constants.ts` holds the glob tables several
  layers read, and `src/meta.test.ts` holds the tree and the tsdown entries to it.
- `packages/eslint-plugin/src/rules/`: one directory per rule, named for its `kebab-case` id and
  holding `<camelCaseExport>.ts`, its test beside it, and `README.md`. The directory name is the id,
  so the id is spelled once. `src/rules/index.ts` is the registry rather than a barrel: it builds the
  `rules` object, so `index.test.ts` beside it holds each id to the rule its own directory exports.
  A helper only one rule uses sits under
  that rule's own `utils/`, suffixed `*Utils` like every other; `src/utils/` is for what rules share.
- Any `utils/` directory, in either package: `*Utils.ts`, so `ruleUtils.ts` and `checkFileUtils.ts`
  rather than `ruleApi.ts` and `checkFile.ts`. Enforced rather than asked for: the `naming` map in
  the root `eslint.config.ts` maps `**/utils/*.ts` to the `*Utils` glob, so a helper module under
  any other name fails `pnpm lint`. A rule's private helpers sit under its own `utils/` for this
  reason: there the suffix is enforced rather than asked for. This is the workspace's own convention and
  `@linteljs/create` deliberately does not ship it to generated projects; DESIGN.md carries that as a
  non-goal.

## The standard this repo holds itself to

The rule files under `packages/create/templates/fragments/claude-rules/` are the published standard.
`.claude/rules/` adopts the three that apply to a workspace of libraries and records where this
repo differs: `type-standards.md`, `testing.md` and `repo-structure.md`. Read them before writing
code here. The per-target rule files do not apply, because this is not one of the nine targets: a
state rule for React or Svelte reactivity has nothing to govern in a package of ESLint rules.
`repo-structure.library.md` is published for a package that is imported rather than run, which is
what these three are, so this workspace's structure rule adopts it rather than asserting a shape of
its own. No target selects it; it ships because the standard for a library is part of the standard.

The enforcement half is installed too, and is the same set a generated project receives:
`.claude/settings.json` running the shipped plugin hooks straight from
`packages/create/templates/project/plugins/linteljs/hooks/`, `.husky/pre-commit` and `commit-msg`,
`lint-staged.config.js`, `commitlint.config.js`, and `scripts/checkBannedPatterns.ts` with
`scripts/typecheckStaged.ts`. The checker's `PROJECT_SKIPPED` carries this workspace's exemptions
with a reason each; `type-standards.md` explains them.

## Verification

Claim nothing that has not been run.

- New or touched code carries zero loose types, TypeScript errors and ESLint findings before it is
  declared done.
- One code file has exactly one test file beside it. A `constants.ts` holds data only and has none,
  and a barrel of nothing but `export ... from` has no code to test. `pnpm test:isolated` runs every
  suite alone and holds each source to its own, and fails on a `constants.ts` with a function or branch.
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
